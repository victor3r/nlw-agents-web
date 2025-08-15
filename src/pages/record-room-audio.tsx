/** biome-ignore-all lint/suspicious/noConsole: <explanation> */
import { useRef, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';

type RoomParams = {
  id: string;
};

const isRecordingSupported =
  !!navigator.mediaDevices &&
  typeof navigator.mediaDevices.getUserMedia === 'function' &&
  typeof MediaRecorder === 'function';

export function RecordRoomAudio() {
  const { id } = useParams<RoomParams>();

  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  function stopRecording() {
    setIsRecording(false);

    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();

      for (const track of recorderRef.current.stream.getAudioTracks()) {
        track.stop();
      }
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }

  async function uploadAudio(audio: Blob) {
    const formData = new FormData();

    formData.append('file', audio, 'recording.webm');

    await fetch(`http://localhost:3333/rooms/${id}/audio`, {
      method: 'POST',
      body: formData,
    });
  }

  function createRecorder(userMedia: MediaStream) {
    recorderRef.current = new MediaRecorder(userMedia, {
      mimeType: 'audio/webm',
      audioBitsPerSecond: 64_000,
    });

    recorderRef.current.ondataavailable = event => {
      if (event.data.size > 0) {
        uploadAudio(event.data);
      }
    };

    recorderRef.current.onstart = () => {
      console.log('Recording started');
    };

    recorderRef.current.onstop = () => {
      console.log('Recording stopped');
    };

    recorderRef.current.start();
  }

  async function startRecording() {
    if (!isRecordingSupported) {
      alert('Gravação de áudio não é suportada neste navegador.');
      return;
    }

    setIsRecording(true);

    const userMedia = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44_100,
      },
    });

    createRecorder(userMedia);

    intervalRef.current = setInterval(() => {
      recorderRef.current?.stop();

      createRecorder(userMedia);
    }, 5000);
  }

  if (!id) {
    return <Navigate replace to="/" />;
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3">
      {isRecording ? (
        <Button className="hover:cursor-pointer" onClick={stopRecording}>
          Pausar gravação
        </Button>
      ) : (
        <Button className="hover:cursor-pointer" onClick={startRecording}>
          Gravar áudio
        </Button>
      )}

      {isRecording ? <p>Gravando...</p> : <p>Pausado</p>}
    </div>
  );
}
