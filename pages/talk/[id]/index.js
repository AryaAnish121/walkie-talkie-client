import Head from 'next/head';
import { useEffect, useState } from 'react';
import style from '../../../styles/Talk.module.css';
import apiBaseUrl from '../../../components/apiBaseUrl';

const talk = ({ id }) => {
  const [paused, setPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const [webScokect, setWebScokect] = useState();
  const [participants, setParticipants] = useState(0);
  const [userId, setUserId] = useState();
  const [stream, setStream] = useState();
  const [mediaRecorder, setMediaRecorder] = useState();

  function dataURLtoBlob(dataurl) {
    var arr = dataurl.split(','),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  function blobToDataURL(blob, callback) {
    var a = new FileReader();
    a.onload = function (e) {
      callback(e.target.result);
    };
    a.readAsDataURL(blob);
  }

  useEffect(() => {
    const ws = new WebSocket(`wss://walkietalkie.aryaanish.repl.co/`);
    setWebScokect(ws);

    ws.onmessage = async (e) => {
      const data = JSON.parse(e.data);

      if (data.status === 'failure') {
        return alert('technical error');
      }

      if (data.status === 'success') {
        if (data.type === 'handShake') {
          try {
            const res = await fetch(
              `${apiBaseUrl}/register?roomId=${id}&userId=${data.data.randomId}`
            );
            const mydata = await res.json();
            if (mydata.status === 'failure') {
              return alert('technical error');
            }
            setUserId(data.data.randomId);
            setParticipants(mydata.data.participants);
          } catch (error) {
            return alert('technical error');
          }
        } else {
          const blob = dataURLtoBlob(data.data.blob);
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.play().catch(() => {
            alert('Please interact once');
          });
        }
      }
    };
  }, []);

  const sendBlobToServer = (blob) => {
    blobToDataURL(blob, (audioUrl) => {
      webScokect.send(
        JSON.stringify({
          roomId: id,
          userId,
          blob: audioUrl,
        })
      );
    });
  };

  const handleClick = async () => {
    if (paused) {
      mediaRecorder.stop();
      stream.getTracks().forEach(function (track) {
        track.stop();
      });
    } else {
      const userMedia = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const userRocrder = new MediaRecorder(userMedia);
      userRocrder.start();

      const audioChunks = [];
      userRocrder.addEventListener('dataavailable', (event) => {
        audioChunks.push(event.data);
      });

      userRocrder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunks);

        sendBlobToServer(audioBlob);
      });

      setStream(userMedia);
      setMediaRecorder(userRocrder);
    }

    setPaused(!paused);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`http://localhost:3000/talk/${id}`);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  return (
    <div className={style.container}>
      <Head>
        <title>In room: {id}</title>
      </Head>
      <img
        src="/walkietalkie-talk.png"
        alt="walkie-talk"
        className={style.walkieTalkieImage}
        onClick={handleClick}
      />
      <img
        src="/record.png"
        alt="record"
        className={`${style.record} ${paused && style.show}`}
      />
      <p className={style.getInviteLink} onClick={handleCopy}>
        {copied ? 'Copied' : 'Copy invite link'}
      </p>
      <p className={style.memberCount}>{participants} members in room</p>
    </div>
  );
};

export async function getServerSideProps(context) {
  const { id } = context.params;

  return {
    props: { id },
  };
}

export default talk;
