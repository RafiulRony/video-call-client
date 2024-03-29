import { useEffect, useReducer, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRequest, postRequest } from "./../../utils/apiRequests";
import {
  BASE_URL,
  GET_CALL_ID,
  SAVE_CALL_ID,
} from "./../../utils/apiEndpoints";
import io from "socket.io-client";
import CallPageHeader from "../UI/CallPageHeader/CallPageHeader";
import CallPageFooter from "../UI/CallPageFooter/CallPageFooter";
import MeetingInfo from "../UI/MeetingInfo/MeetingInfo";
import Messenger from "../UI/Messenger/Messenger";
import MessageListReducer from "../../reducers/MessageListReducer";
import Peer from "simple-peer";
import './CallPage.scss';

let peer = null;
const socket = io.connect(process.env.REACT_APP_BASE_URL);
const initialState = [];
const CallPage = () =>{
    const navigate = useNavigate();
    let {id} = useParams();
    const isAdmin = window.location.hash === "#init" ? true : false;
    const url = `${window.location.origin}${window.location.pathname}`;

    const [streamObj, setStreamObj] = useState();
    const [screenCastStream, setScreenCastStream] = useState();
    const [meetInfoPopup, setMeetInfoPopup] = useState(false);
    const [isPresenting, setIsPresenting] = useState(false);
    const [isMessenger, setIsMessenger] = useState(false);
    const [messageAlert, setMessageAlert] = useState({});
    const [isAudio, setIsAudio] = useState(true);

    useEffect(() => {
        if (isAdmin) {
          setMeetInfoPopup(true);
        }
        initWebRTC();
        socket.on("code", (data) => {
            if (data.url === url) {
              peer.signal(data.code);
            }
          });
    }, []);

    const getReceiverCode = async () => {
        console.log('receiver code');
        const response = await getRequest(`${BASE_URL}${GET_CALL_ID}/${id}`);
        if (response.code) {
          console.log('getting response in receiver');
          peer.signal(response.code);
        }
        else{
          console.log('error in receiver code');
        }
      };

    const initWebRTC = () => {
        navigator.mediaDevices
        .getUserMedia({
        video: true,
        audio: true,
        })
        .then((stream) => {
          setStreamObj(stream);
          peer = new Peer({
            initiator: isAdmin,
            trickle: false,
            stream: stream,
          });
  
          if (!isAdmin) {
            getReceiverCode();
          }
          peer.on("signal", async (data) => {
            if (isAdmin) {
              let payload = {
                id,
                signalData: data,
              };
              console.log(data);
              await postRequest(`${BASE_URL}${SAVE_CALL_ID}`, payload);
            } else {
              socket.emit("code", { code: data, url }, (cbData) => {
                console.log("code sent");
              });
            }
          });
          peer.on("connect", () => {
            console.log("peer connected");
          });
          peer.on("stream", (stream) => {
            // got remote video stream, now let's show it in a video tag
            let video = document.querySelector("video");
  
            if ("srcObject" in video) {
              video.srcObject = stream;
            } else {
              video.src = window.URL.createObjectURL(stream); // for older browsers
            }
  
            video.play();
          });
        })
        .catch(() => {
          console.log("error");
        });
    }

    const screenShare = () => {
      navigator.mediaDevices
        .getDisplayMedia({ cursor: true })
        .then((screenStream) => {
          peer.replaceTrack(
            streamObj.getVideoTracks()[0],
            screenStream.getVideoTracks()[0],
            streamObj
          );
          setScreenCastStream(screenStream);
          screenStream.getTracks()[0].onended = () => {
            peer.replaceTrack(
              screenStream.getVideoTracks()[0],
              streamObj.getVideoTracks()[0],
              streamObj
            );
          };
          setIsPresenting(true);
        });
    };

    const stopScreenShare = () => {
      screenCastStream.getVideoTracks().forEach(function (track) {
        track.stop();
      });
      peer.replaceTrack(
        screenCastStream.getVideoTracks()[0],
        streamObj.getVideoTracks()[0],
        streamObj
      );
      setIsPresenting(false);
    };

    return (
        <div className="callpage-container">
            <video className="video-container" src="" controls></video>
            <CallPageHeader />
            <CallPageFooter
              isPresenting={isPresenting}
              stopScreenShare={stopScreenShare}
              screenShare={screenShare}
            />
            {isAdmin && meetInfoPopup && <MeetingInfo setMeetInfoPopup={setMeetInfoPopup} url={url} />}
            <Messenger />
        </div>
    )
}

export default CallPage;