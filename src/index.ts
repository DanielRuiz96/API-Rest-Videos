import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { spawn } from 'child_process';
import fs from 'fs';

const app = express();
const port = process.env.PORT || 3000;
const videosDirectory = process.env.VIDEOS_DIRECTORY || './videos';

app.use(express.json());

app.post('/api/v1/transform/webmtomp4', (req, res) => {
  const { videoName } = req.body;

  if (!videoName) {
    res.status(400).json({ error: 'Se requiere el nombre del video.' });
    return;
  }

  const inputFilePath = `${videosDirectory}/${videoName}.webm`;
  const outputFilePath = `${videosDirectory}//${videoName}.mp4`;

  const fileExists = fs.existsSync(outputFilePath);

  const ffmpegCommand = spawn('ffmpeg', ['-i', inputFilePath, '-c:v', 'libx264', '-c:a', 'aac', '-y', outputFilePath]);

  ffmpegCommand.on('exit', (code) => {
    if (code === 0) {
      if (fileExists) {
        res.json({ message: 'Video convertido exitosamente. El archivo de salida ha sido sobrescrito.' });
      } else {
        res.json({ message: 'Video convertido exitosamente.' });
      }
    } else {
      //console.error('Código de salida de ffmpeg:', code);
      res.status(500).json({ error: 'Ocurrió un error al convertir el video.' });
    }
  });
});

app.post('/api/v1/transform/mp4towebm', (req, res) => {
  const { videoName } = req.body;

  if (!videoName) {
    res.status(400).json({ error: 'Se requiere el nombre del video.' });
    return;
  }

  const inputFilePath = `${videosDirectory}/${videoName}.mp4`;
  const outputFilePath = `${videosDirectory}/${videoName}.webm`;

  const fileExists = fs.existsSync(outputFilePath);

  const ffmpegCommand = spawn('ffmpeg', ['-i', inputFilePath, '-c:v', 'libvpx', '-c:a', 'libvorbis', '-y', outputFilePath]);

  ffmpegCommand.on('exit', (code) => {
    if (code === 0) {
      if (fileExists) {
        res.json({ message: 'Video convertido exitosamente. El archivo de salida ha sido sobrescrito.' });
      } else {
        res.json({ message: 'Video convertido exitosamente.' });
      }
    } else {
      //console.error('Código de salida de ffmpeg:', code);
      res.status(500).json({ error: 'Ocurrió un error al convertir el video.' });
    }
  });
});

app.post('/api/v1/transform/mutevideos', (req, res) => {
  const { mp4VideoName, webmVideoName } = req.body;

  if (!mp4VideoName || !webmVideoName) {
    res.status(400).json({ error: 'Se requieren los nombres de los videos.' });
    return;
  }

  const mp4InputFilePath = `${videosDirectory}/${mp4VideoName}.mp4`;
  const mp4OutputFilePath = `${videosDirectory}/${mp4VideoName}_muted.mp4`;

  const webmInputFilePath = `${videosDirectory}/${webmVideoName}.webm`;
  const webmOutputFilePath = `${videosDirectory}/${webmVideoName}_muted.webm`;

  const mp4FileExists = fs.existsSync(mp4OutputFilePath);
  const webmFileExists = fs.existsSync(webmOutputFilePath);

  const ffmpegCommand1 = spawn('ffmpeg', ['-i', mp4InputFilePath, '-c', 'copy', '-an', '-y', mp4OutputFilePath]);
  const ffmpegCommand2 = spawn('ffmpeg', ['-i', webmInputFilePath, '-c', 'copy', '-an', '-y', webmOutputFilePath]);

  let completedTasks = 0;
  let errorOccurred = false;

  const checkCompletion = () => {
    if (completedTasks === 2) {
      if (!errorOccurred) {
        const response = {
          message: 'Videos convertidos exitosamente.'
        };
        res.json(response);
      } else {
        res.status(500).json({ error: 'Ocurrió un error al convertir los videos.' });
      }
    }
  };

  ffmpegCommand1.on('exit', (code) => {
    if (code === 0) {
      if (mp4FileExists) {
        console.log(`Video ${mp4OutputFilePath} sobrescrito.`);
      }
      completedTasks++;
      checkCompletion();
    } else {
      //console.error('Código de salida de ffmpeg para el video MP4:', code);
      errorOccurred = true;
      completedTasks++;
      checkCompletion();
    }
  });

  ffmpegCommand2.on('exit', (code) => {
    if (code === 0) {
      if (webmFileExists) {
        console.log(`Video ${webmOutputFilePath} sobrescrito.`);
      }
      completedTasks++;
      checkCompletion();
    } else {
      //console.error('Código de salida de ffmpeg para el video WebM:', code);
      errorOccurred = true;
      completedTasks++;
      checkCompletion();
    }
  });
});


app.listen(port, () => {
  console.log(`Servidor API escuchando en el puerto ${port}`);
});
