import { getImageBySentence } from "../src/get-up";
import type { Response } from "../src/types";
import path from "path";
import fs from "fs";
import stream from "stream";
import { promisify } from "util";

const pipeline = promisify(stream.pipeline);

async function init() {
    const cwd = process.cwd();

    const argv = require("minimist")(process.argv.slice(2));
    if (argv.cookie && typeof argv.cookie !== 'boolean') {
        try {
            // const res =  {
            //     images: [
            //         'https://tse1.mm.bing.net/th/id/OIG.0lT30AZgF0Y9TGnssoUu',
            //         'https://tse2.mm.bing.net/th/id/OIG.AYKgb1ftqrAfxCfwGjCs',
            //         'https://tse1.mm.bing.net/th/id/OIG.GcNrrihRgfhlHOwiRtR.'
            //     ],
            //     content: '关山别荡子，风月守空闺。',
            //     origin: '昔昔盐',
            //     author: '薛道衡',
            //     category: '古诗文-抒情-离别'
            // }
            const res: Response = await getImageBySentence(argv.cookie);
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

            const rowHead = `> ${res.content} —— ${res.author}《${res.origin}》\n`
            let appendCtx = `|${imgPaths.map(_=>'      ').join('|')}|\n`
            appendCtx += `|${imgPaths.map(_=>' :----: ').join('|')}|\n`
            appendCtx += `|${imgPaths.join('|')}|`
            fs.appendFileSync('./README.md', [
                '',
                rowHead,
                appendCtx,
                ''
            ].join('\n'))

            // 缓冲等待，确保未捕获的异步任务都能跑完
            console.log('Wating Sec...')
            setTimeout(() => {
                process.exit(0);
            }, 5 * 1000);
        } catch (e) {
            console.error(e);
            process.exit(1);
        }
    } else {
        throw new Error("Please provide a cookie using the --cookie argument");
    }
}

init().catch((e) => {
    console.error(e);
});
