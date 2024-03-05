import { getImageBySentence } from "../src/get-up";
import type { Response } from "../src/types";
import path from "path";
import fs from "fs";
import stream from "stream";
import { promisify } from "util";

const pipeline = promisify(stream.pipeline);

async function init() {
    const cwd = process.cwd();
    try {
        const res: Response = await getImageBySentence();
        console.log("Create Successful: ", res);

        const imagesPath = path.join(cwd, "images");
        if (!fs.existsSync(imagesPath)) {
            fs.mkdirSync(imagesPath);
        }

        // 在 images 目录下，创建一个以时间戳命名的文件夹，将图片放入其中
        const imagesFolderName = Date.now().toString();
        const imagesFolderPath = path.join(imagesPath, imagesFolderName);
        if (!fs.existsSync(imagesFolderPath)) {
            fs.mkdirSync(imagesFolderPath);
        }
        const images = res.images
        let imgPaths:any[] = []
        // 将图片放入 images 目录下的文件夹中
        for(let i = 0; i < images.length; i++){
             // images 中是网络url，请求图片，将图片保存到 images 目录下的文件夹中
            const imageFileName = `${i}.jpg`;
            const imageFilePath = path.join(imagesFolderPath, imageFileName);
            const imageDocPath = `./images/${imagesFolderName}/${imageFileName}`
            imgPaths.push(`![${imagesFolderName}_${imageFileName}](${imageDocPath})[${imageFileName}](${images[i]})`)

            // 下载图片
            console.log('fetching...', images[i])
            const res:any = await fetch(images[i])
            if (!res.ok) throw new Error(`unexpected response ${res.statusText}`);
            await pipeline(res.body, fs.createWriteStream(imageFilePath)).catch((e) => {
                console.error("Something went wrong while saving the image", e);
            });
            console.log('>fetched', images[i])
        }
        console.log('Fetch Images Ended')

        const options = { timeZone: "Asia/Shanghai", hour12: false };
        const outputData = {
            ...res,
            date: new Date().toLocaleString("zh-CN", options),
            localImagesPath: imagesFolderName,
        };

        const contentFile = path.join(imagesFolderPath, 'index.json');

        fs.writeFileSync(contentFile, JSON.stringify(outputData));

        const rowHead = `> ${res.content} —— ${res.author}(${res.dynasty})《${res.origin}》\n`;
        const details = `**CreateAt:** ${outputData.date} | **Tags:** ${res.category}\n`;
        let imgsTable = `|${imgPaths.map(_=>'      ').join('|')}|\n`;
        imgsTable += `|${imgPaths.map(_=>' :----: ').join('|')}|\n`;
        imgsTable += `|${imgPaths.join('|')}|`;

        fs.appendFileSync('./README.md', [
            '',
            rowHead,
            details,
            imgsTable,
            ''
        ].join('\n'));

        // 缓冲等待，确保未捕获的异步任务都能跑完
        console.log('Wating Sec...');
        setTimeout(() => {
            console.log('Done! Exit now.');
            process.exit(0);
        }, 5 * 1000);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

init().catch((e) => {
    console.error(e);
});
