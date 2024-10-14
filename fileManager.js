import {
  existsSync,
  lstatSync,
  readdirSync,
  createReadStream,
  writeFile,
  rename,
  unlink,
  createWriteStream,
} from 'fs';
import { dirname, resolve, join } from 'path';
import { homedir, cpus as _cpus, userInfo, arch, EOL } from 'os';
import os from 'os';
import { argv, exit, stdin, stdout } from 'process';
import { createInterface } from 'readline';

const usernameArg = argv.find((arg) => arg.startsWith('--username='));
const username = usernameArg ? usernameArg.split('=')[1] : 'User';
const homeDir = homedir();
let currentDir = homeDir;

console.log(`Welcome to the File Manager, ${username}!`);
console.log(`You are currently in ${currentDir}`);

process.on('SIGINT', () => {
  console.log(`Thank you for using File Manager, ${username}, goodbye!`);
  exit();
});

const rl = createInterface({
  input: stdin,
  output: stdout,
});

const prompt = () => {
  rl.question('> ', (input) => {
    const args = input.split(' ');
    const command = args[0];

    switch (command) {
      case 'up':
        if (currentDir !== homeDir) {
          currentDir = dirname(currentDir);
        }
        break;

      case 'cd':
        const targetDir = args[1];
        if (!targetDir) {
          console.log('Please provide a directory.');
          break;
        }
        const newPath = resolve(currentDir, targetDir);
        if (existsSync(newPath) && lstatSync(newPath).isDirectory()) {
          currentDir = newPath;
        } else {
          console.log('Invalid directory');
        }
        break;

      case 'ls':
        const items = readdirSync(currentDir);
        items.sort((a, b) => {
          const isDirA = lstatSync(join(currentDir, a)).isDirectory();
          const isDirB = lstatSync(join(currentDir, b)).isDirectory();
          if (isDirA && !isDirB) return -1;
          if (!isDirA && isDirB) return 1;
          return a.localeCompare(b);
        });
        items.forEach((item) => {
          const type = lstatSync(join(currentDir, item)).isDirectory() ? 'directory' : 'file';
          console.log(`${item} - ${type}`);
        });
        break;

      case 'cat':
        const filePath = args[1];
        const readPath = resolve(currentDir, filePath);
        if (existsSync(readPath) && lstatSync(readPath).isFile()) {
          const readableStream = createReadStream(readPath, { encoding: 'utf-8' });
          readableStream.on('data', (chunk) => console.log(chunk));
          readableStream.on('error', () => console.log('Error reading file'));
        } else {
          console.log('Invalid file path');
        }
        break;

      case 'add':
        if (args.length < 2) {
          console.log('Please provide a filename.');
          break;
        }
        const newFileName = args[1];
        const newFilePath = join(currentDir, newFileName);
        writeFile(newFilePath, '', (err) => {
          if (err) {
            console.log('Operation failed');
          } else {
            console.log(`File ${newFileName} created`);
          }
        });
        break;

      case 'rn':
        const oldFilePath = resolve(currentDir, args[1]);
        const newFileTitle = args[2];
        const newFilePathTitle = join(currentDir, newFileTitle);
        if (existsSync(oldFilePath) && lstatSync(oldFilePath).isFile()) {
          rename(oldFilePath, newFilePathTitle, (err) => {
            if (err) {
              console.log('Operation failed');
            } else {
              console.log(`File renamed to ${newFileTitle}`);
            }
          });
        } else {
          console.log('Invalid file path');
        }
        break;

      case 'rm':
        const deleteFilePath = resolve(currentDir, args[1]);
        if (existsSync(deleteFilePath) && lstatSync(deleteFilePath).isFile()) {
          unlink(deleteFilePath, (err) => {
            if (err) {
              console.log('Operation failed');
            } else {
              console.log('File deleted');
            }
          });
        } else {
          console.log('Invalid file path');
        }
        break;

      case '.exit':
        console.log(`Thank you for using File Manager, ${username}, goodbye!`);
        exit();

      case 'cp':
        const sourcePath = path.resolve(currentDir, args[1]);
        const destPath = path.resolve(currentDir, args[2]);
        if (fs.existsSync(sourcePath) && fs.lstatSync(sourcePath).isFile()) {
          const readStream = fs.createReadStream(sourcePath);
          const writeStream = fs.createWriteStream(destPath);
          readStream.pipe(writeStream);
          writeStream.on('finish', () => console.log(`File copied to ${destPath}`));
          writeStream.on('error', () => console.log('Operation failed'));
        } else {
          console.log('Invalid source file');
        }
        break;

      case 'mv':
        const moveSourcePath = resolve(currentDir, args[1]);
        const moveDestPath = resolve(currentDir, args[2]);
        if (existsSync(moveSourcePath) && lstatSync(moveSourcePath).isFile()) {
          const readStream = createReadStream(moveSourcePath);
          const writeStream = createWriteStream(moveDestPath);
          readStream.pipe(writeStream);
          writeStream.on('finish', () => {
            unlink(moveSourcePath, (err) => {
              if (err) console.log('Operation failed');
              else console.log(`File moved to ${moveDestPath}`);
            });
          });
        } else {
          console.log('Invalid source file');
        }
        break;

      case 'os':
        const option = args[1];
        switch (option) {
          case '--EOL':
            console.log(`EOL: ${os.EOL}`);
            break;

          case '--cpus':
            const cpus = _cpus();
            console.log(`CPU Info: ${cpus.length} CPUs`);
            cpus.forEach((cpu, index) => {
              console.log(`CPU ${index + 1}: ${cpu.model}, ${cpu.speed / 1000} GHz`);
            });
            break;

          case '--homedir':
            console.log(`Home Directory: ${homedir()}`);
            break;

          case '--username':
            console.log(`Current User: ${userInfo().username}`);
            break;

          case '--architecture':
            console.log(`Architecture: ${arch()}`);
            break;

          default:
            console.log('Invalid input');
        }
        break;

      case 'hash':
        const hashFilePath = resolve(currentDir, args[1]);
        const hash = crypto.createHash('sha256');
        const stream = createReadStream(hashFilePath);
        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => console.log(`Hash: ${hash.digest('hex')}`));
        stream.on('error', () => console.log('Operation failed'));
        break;

      case 'compress':
        const compressFilePath = resolve(currentDir, args[1]);
        const compressDestPath = resolve(currentDir, args[2]);
        const gzip = zlib.createBrotliCompress();
        const input = createReadStream(compressFilePath);
        const output = createWriteStream(compressDestPath);
        input.pipe(gzip).pipe(output);
        output.on('finish', () => console.log(`File compressed to ${compressDestPath}`));
        break;

      case 'decompress':
        const decompressFilePath = resolve(currentDir, args[1]);
        const decompressDestPath = resolve(currentDir, args[2]);
        const gunzip = zlib.createBrotliDecompress();
        const inputDecompress = createReadStream(decompressFilePath);
        const outputDecompress = createWriteStream(decompressDestPath);
        inputDecompress.pipe(gunzip).pipe(outputDecompress);
        outputDecompress.on('finish', () =>
          console.log(`File decompressed to ${decompressDestPath}`),
        );
        break;

      default:
        console.log('Invalid input');
    }

    console.log(`You are currently in ${currentDir}`);
    prompt();
  });
};

prompt();
