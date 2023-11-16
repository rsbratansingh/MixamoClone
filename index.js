const express = require('express');  //import using require
const app = express();
const http = require("http");
const fs = require('fs');
const path = require("path");
const PORT = process.env.PORT || 3000;
const cors = require('cors');
const mongooes = require("mongoose")   //import mongoes
const dotenv = require("dotenv"); //configure environment variable
const formidable = require("formidable")//for parsing form data
dotenv.config();
var { Playlist } = require("./Models");
const { playlistModel, fileModel } = require("./Models");
const { escape } = require('querystring');
const { allowedNodeEnvironmentFlags } = require('process');
//connect to mongoDB
mongooes.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("DB Connection: ", process.env.MONGODB_URL);
    console.log("Connected to MongoDB");
}).catch((err) => {
    console.log("Database connection failed ", err);
})
const db = mongooes.connection;
fileCollection = db.collection('files');
// get data from database
async function getFilesFromPlaylist() {
    try {
        const data = await playlistModel.find({}).lean();
        Playlist = data;
        console.log('Documnets ', data);
        return data;
    } catch (err) {
        console.log("Error occured ", err);
        Playlist = [];
        return [];
    }
}
app.get('/playlist', async (req, res) => {
    try {
        const data = await getFilesFromPlaylist();
        console.log("Updated Data ", data);
        res.json(data);
    } catch (err) {
        console.log("Error occured ", err);
        res.status(500).json({ error: "An Error occured" });
    }
})
app.get('/playlist/:id', async (req, res) => {
    const id = req.params.id;
    const SelectedPlaylist = await playlistModel.findById(id)
        .then((data) => { console.log('data:', data); return data; }, (err) => { console.error("Cannot read properties of this Playlist ", err); })
})

// const corsOptions={
//     origin:'http://localhost:3000'
// }
// app.use(cors(corsOptions)); // i adding this so that i can access the data from the localhost 4200 port and it is required
//  when i try to load the animation folder files of the mixamo-clone and remove cors error 'Origin <orign> is not allowed by access-control-allow-origin' 
// error occured in the list component `/files/uploadData` post request

app.use(cors());
app.use(express.json());
app.use('/assets', express.static("I:/Mixamo/mixamoClone/src/assets/Animations"));

app.post('/added', async (req, res) => {
    console.log('Data from angular ', req.body);
    const name = req.body.name;
    const id = req.body.id;
    newFileModel = new playlistModel(req.body);
    console.log("playlist model ", newFileModel);
    try {
        const result = await newFileModel.save();
        console.log("result ", result);
        res.status(201).json({ message: 'Data added Successfully ', result });
    } catch (e) {
        console.log("error ", e);
        res.status(500).json({ error: `An error occured ${e.message}` });
        console.log("Error occured ", e.message);
    }
})
// add to particular playlist
app.post('/added/:id', async (req, res) => {
    const id = req.params.id;
    const { name, files, BothCharacters } = req.body;
    // console.log('Data from angular ', req.body);

    const requestData = req.body;
    const newFileModel = new fileModel(requestData);
    try {
        if (id.length < 10) {
            Playlist = await playlistModel.find({ index: id })
            console.log("Playlist find that have index field ", Playlist);
        }
        else {
            Playlist = await playlistModel.findById(id);
            console.log("Playlist data with id ", Playlist);
        }
        if (!Playlist)
            return res.status(404).json({ error: 'Document not Found' });
        if (requestData.isBothCharacterFile == false) {
            console.log("file added to files ", requestData);
            Playlist.files.push(newFileModel);
            await Playlist.save();
        }
        else if (requestData.isBothCharacterFile) {
            console.log("file added to BothCharacters ", requestData);
            Playlist.BothCharacters.push(newFileModel);
            await Playlist.save();
        }
        res.status(201).json({ message: 'Data added Successfully ', requestData });
    } catch (e) {
        res.status(500).json({ error: 'An error occured ' });
    }
});
const directoryPath = "I:/Mixamo/mixamoClone/src/assets";

// add file to files collection
app.post('/files/newData', (req, res) => {
    let animationFile = {}
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.log("Error parsing data");
        }
        let name = fields.name;
        let tags = fields.tags;
        animationFile.name = name.toString();
        tags = tags.toString().split(',');
        animationFile.tags = tags;
        animationFile.isBothCharacterFile = false;
        animationFile.markFavourite = false;
        const id = `${Date.now()}${Math.random().toString(36).substring(7)}`;
        animationFile.id = id.toString();
        if (files.src) {
            const src = Array.isArray(files.src) ? files.src : [files.src];
            console.log("file src ", files.src);
            src.forEach((srcFile) => {
                const fileExtension = path.extname(srcFile.originalFilename);
                const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
                const destinationPath = path.join(`${directoryPath}/Animations`, uniqueFilename);
                // console.log("file moved ", srcFile);
                fs.copyFileSync(srcFile.filepath, destinationPath);
                fs.unlinkSync(srcFile.filepath);
                const location = `../assets/Animations/${uniqueFilename}`;
                if (animationFile.ext?.length > 1) {
                    if (animationFile.ext?.indexOf(fileExtension) == -1) {
                        animationFile.ext.push(fileExtension);
                    }
                }
                else { animationFile.ext = fileExtension; }
                if (animationFile.src?.length > 1) { animationFile.src.concat(location); }
                else {
                    animationFile.src = location;
                }
            })
        }
        if (files.img) {
            const img = files.img;
            animationFile.img = img;
            img.forEach((img) => {
                const imageExtension = path.extname(img.originalFilename);
                console.log("image name ", img.filepath);
                // console.log("Image file ", img);
                const imageUniquename = `${Date.now()}-${Math.random().toString(30).substring(6)}${imageExtension}`;
                const imgDestinationPath = path.join(`${directoryPath}/Images`, imageUniquename);
                fs.copyFileSync(img.filepath, imgDestinationPath);
                fs.unlinkSync(img.filepath);
                const imgLocation = `../assets/Images/${imageUniquename}`;
                animationFile.img = imgLocation;
            })
        }
        newFileModel = new fileModel(animationFile);
        console.log("file model ", newFileModel);
        try {
            const result = await newFileModel.save();
            console.log("result ", result);
            res.status(201).json({ message: 'Data added Successfully ', result });
        } catch (e) {
            console.log("error ", e);
            res.status(500).json({ error: `An error occured ${e.message}` });
            console.log("Error occured ", e.message);
        }
    })
})
// change favourite value
app.put('/files/fileFavourite/:id', async (req, res) => {
    const id = req.params.id;
    const favourite = req.body.markFavourite;
    console.log("favourite value in file ", favourite);
    try {
        const file = await fileModel.findByIdAndUpdate(id, { markFavourite: favourite }, { new: true });
        if (!file) {
            return res.status(404).json({ message: "File not found!" });
        }
        res.status(200).json({ message: 'File marked as favourite successfully' });
    } catch (err) {
        console.error('Error renaming file ', err)
        res.status(500).json({ error: 'INternal server error' });
    }
})
// update existing file 
app.post('/files/updateFile/:id', async (req, res) => {
    // console.log("api called update files")
    const id = req.params.id;
    const existingFile = await fileModel.findById(id);
    if (!existingFile) {
        return res.status(404).json({ message: "File not Found!" })
    }
    let updatedAnimationData = {}
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.log("Error parsing form data");
        }
        const name = fields.name;
        const tags = fields.tags;
        updatedAnimationData.name = name.toString();
        if (tags.length) {
            let tag = tags.toString().split(',');
            updatedAnimationData.tags = tag;
        } else {
            console.log("else called")
            updatedAnimationData.tags = tags;
        }
        console.log("updated data1 ", name, "tag ", tags,);
        if (files.src) {
            const src = Array.isArray(files.src) ? files.src : [files.src];
            updatedAnimationData.src = src;
            // console.log("src file ", src);
            src.forEach((srcFile) => {
                const fileExtension = path.extname(srcFile.originalFilename);
                const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
                const destinationPath = path.join(`${directoryPath}/Animations`, uniqueFilename);
                // console.log("file moved ", srcFile);
                fs.copyFileSync(srcFile.filepath, destinationPath);
                fs.unlinkSync(srcFile.filepath);
                const location = `../assets/Animations/${uniqueFilename}`;
                if (fileExtension !== '') {
                    // fileExtension !== '.fbx' &&
                    if (existingFile.ext.indexOf(fileExtension) == -1) {
                        updatedAnimationData.ext = existingFile.ext.concat(fileExtension);
                    }
                }
                updatedAnimationData.src = existingFile.src.concat(location);
            })
        }
        if (files.img) {
            const img = files.img;
            updatedAnimationData.img = img;
            img.forEach((img) => {
                const imageExtension = path.extname(img.originalFilename);
                console.log("image name ", img.filepath);
                // console.log("Image file ", img);
                const imageUniquename = `${Date.now()}-${Math.random().toString(30).substring(6)}${imageExtension}`;
                const imgDestinationPath = path.join(`${directoryPath}/Images`, imageUniquename);
                fs.copyFileSync(img.filepath, imgDestinationPath);
                fs.unlinkSync(img.filepath);
                const imgLocation = `../assets/Images/${imageUniquename}`;
                updatedAnimationData.img = imgLocation;
            })
            if (existingFile.img) {
                console.log("existing file ", existingFile.img);
                let imgName = existingFile.img;
                let nameArr = imgName.split('/')
                console.log("name of image ", nameArr[nameArr.length - 1]);
                const exactLocation = `I:/Mixamo/mixamoClone/src/assets/Images/${nameArr[nameArr.length - 1]}`;
                if (existingFile.img != `../assets/x-button.png` || existingFile.img !== '' || existingFile.img !== undefined) {
                    console.log("remove previous image");
                    try {
                        fs.unlinkSync(exactLocation); //remove previous file that is stored in the file data 
                    } catch (err) {
                        console.error("cant remove old image or image not found ", err);
                    }
                }
            }
        }
        try {
            const updatedFile = await fileModel.findByIdAndUpdate(id,
                updatedAnimationData, { new: true })
            if (!updatedFile) {
                return res.status(404).json({ message: 'File Not found' })
            }
            res.json({ location: 'Updated successfully' });
        } catch (error) {
            console.log("Error occured while updataing data ", error)
            res.status(500).json({ message: "Internal server error can't edit data " })
        }
    })
})

// rename playlist 
app.put('/rename/:id', async (req, res) => {
    const id = req.params.id;
    const newName = req.body.name;
    console.log(newName);
    try {
        const updatedPlaylist = await playlistModel.findByIdAndUpdate(
            id,
            { name: newName },
            { new: true }
        );
        if (!updatedPlaylist) {
            return res.status(404).json({ error: 'Playlist not Found ', error })
        }
        res.status(200).json({ message: 'Playlist renamed successfully' });
    }
    catch (err) {
        console.error('Error renaming playlist ', err)
        res.status(500).json({ error: 'INternal server error' });
    }
})

// delete selected Playlist
app.delete('/playlist/:id', async (req, res) => {
    const playlistId = req.params.id;
    const version = req.params.__v;
    console.log('id:', playlistId);
    try {
        const deltedPlaytlist = await playlistModel.findByIdAndDelete({ _id: playlistId, __v: version });
        if (!deltedPlaytlist) { return res.status(404).json({ error: 'Playlist not Found' }) }
        res.json({ message: 'Playlist deleted successfully' });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ error: "Internal server error", err });
    }
})
app.delete('/playlist/:pid/:name/:id', async (req, res) => {
    const PlaylistId = req.params.pid;
    const fileIdToDelete = req.params.id;
    const name = req.params.name;
    try {
        const playlist = await playlistModel.findById(PlaylistId);
        if (!playlist) {
            console.log("Playlist not found");
            return res.status(400).json({ error: "Playlist not found " });
        }
        if (name == "files") {
            if (fileIdToDelete.length <= 10) {
                const fileIndex = await playlistModel.find({ "files.index": { $exists: true } })
                console.log(fileIndex);
                playlist.files.splice(fileIndex, 1);
                await playlist.save();
                console.log('Playlist', playlist.files);
            }
            else {
                playlist.files = playlist.files.filter(file => file._id.toString() !== fileIdToDelete);
                const updatedPlaylist = await playlist.save();
                console.log("updatedPlaylist: ", updatedPlaylist);
            }
        }
        else {
            if (fileIdToDelete.length <= 10) {
                const fileIndex = await playlistModel.find({ "BothCharacters.index": { $exists: true } })
                console.log("bothCharacters index", fileIndex);
                playlist.BothCharacters.splice(fileIndex, 1);
                await playlist.save();
                console.log('Playlist', playlist.BothCharacters);
            }
            else {
                playlist.BothCharacters = playlist.BothCharacters.filter(file => file._id.toString() !== fileIdToDelete);
                const updatedPlaylist = await playlist.save();
                console.log("updatedPlaylist: ", updatedPlaylist);
            }
        }
        return res.json({ message: "Playlist data deleted Successfully " });
    } catch (err) {
        console.error("Internal server error: ", err);
        return res.status(500).json({ error: "Internal server error! ", err });
    }
});

function generateRandomId(length) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i <= length; i++) {
        const index = Math.floor(Math.random() * charset.length)
        id += charset.charAt(index);
    }
    return id;
}

// merge two files and push it to bothAnimation Files
app.post('/mergeFiles', async (req, res) => {
    let data = req.body.data;
    // console.log("data came form frontend ",data);
    let fullPth = [];
    let fileArray = [];
    fileArray.push(data[0]);
    fileArray.push(data[1]);
    fullPth.push(data[0].fullPath);
    fullPth.push(data[0].fullPath);
    let array = [...data[0].ext, ...data[1].ext]
    console.log("data ", array);
    // let image = '';
    // if (data[0].img !== undefined || data[0].img !== '' || data[0].img !== null) {
    //     image = data[0].img;
    // } else if (data[1].img !== undefined || data[1].img !== '' || data[1].img !== null) {
    //     image = data[1].img;
    // } else { image = '' }
    // if (data[2]) {
    //     image = data[2].image;
    //     console.log("image for new merged file ", image);
    //     if (image) {
    //         console.log("image for new merged file ", image);
    //     } else { image = '' }
    // }
    let BothAnimationData = {
        name: data[0].name + " and " + data[1].name,
        isBothCharacterFile: true,
        markFavourite: false,
        tags: [...data[0].tags, ...data[1].tags],
        ext: [...new Set(array)],
        img: '../assets/x-button.png',
        files: [...fileArray]
        // BothCharacters: [{
        //     name: data[0].name + " and " + data[1].name,
        //     markFavourite: false,
        //     isBothCharacterFile: true,
        //     tags: [...data[0].tags, ...data[1].tags],
        //     files: [data[0], data[1]]
        // }]
    }
    console.log("both aniamtion files ", BothAnimationData);
    try {
        const Model = new fileModel(BothAnimationData)
        const data = await Model.save();
        // const data= await fileModel.save(BothAnimationData, { returnNewDocument: true, new: true, strict: false });
        res.status(201).json({ message: "Data added successfully ", data })
    } catch (err) {
        res.status(500, "Internal Server Error Data can't merged", err)
    }
})
// upload files in db by path 
app.post('/files/uploadData', async (req, res) => {
    let data = req.body.data;
    console.log("data ", data);
    const path = data.path;
    const format = data.format;
    const isBothAnimation = data.isBothAnimation;
    // console.log("data from the angular ", path, format, isBothAnimation);
    const allFiles = getAllFilesInDirectory(path, format, isBothAnimation)
    console.log("all files from the localhost ", allFiles);
    try {
        if (allFiles) {
            for (const item of allFiles) {
                const src = Array.isArray(item.src) ? item.src : [item.src];
                console.log("file src ", item.src);
                src.forEach((srcFile) => {
                    // const fileExtension = '.fbx';
                    const parts = srcFile.toString().split('.');
                    const fileExtension = `.${parts[parts.length - 1]}`;
                    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
                    let filePath = `${directoryPath}/Animations/${uniqueFilename}`
                    // if (item.isBothCharacterFile) {
                    //     filePath = `${directoryPath}/Animations/BothAnimations/${uniqueFilename}`
                    // }
                    const destinationPath = filePath;
                    fs.readFileSync(srcFile.toString())
                    // console.log("src file ", srcFile.toString(), typeof (srcFile));
                    // if (srcFile === 'string') {
                    let file = srcFile.toString();
                    fs.copyFileSync(file, destinationPath);  //it will copy the file in the destination 
                    // fs.unlinkSync(srcFile.filepath);
                    // }
                    // }else {
                    //     console.log("file is not a valid string ")
                    // }
                    let location = `../assets/Animations/${uniqueFilename}`
                    // if (item.isBothCharacterFile) {
                    //     location = `../assets/Animations/${uniqueFilename}`;
                    // }
                    if (srcFile.src?.length > 1) {
                        srcFile.src.concat(location);
                        item.src.concat(location)
                    }
                    else {
                        srcFile.src = location;
                        item.src = location;
                    }
                })
                const file = new fileModel(item);
                await file.save();
            }
            res.json(allFiles);
        }
    }
    catch (err) {
        console.log("Error occured can't save files to Mognodb ", err)
        res.status(500).json({ error: "Error occured while savibng files to Mongodb: ", err });
    }
})
async function getFilesSrcMetadata() {
    const fileList = await fileModel.find({ "isBothCharacterFile": false }, { 'fullPath': 1 })
    let data = fileList.map((value) => value.fullPath);
    let fullArray = [].concat(...data);
    // console.log("getFilesSrcMetadata line 498");
    // console.log("fileList ", fullArray);
    return fullArray;
}

async function getAllFilesInDirectoryToDB(directoryPath, fileList = []) {
    const files = fs.readdirSync(directoryPath);
    const AlreadyExistFiles = await getFilesSrcMetadata();
    async function addFileToMetadata(file) {
        const fullPath = path.join(directoryPath, file);
        const stat = fs.statSync(fullPath);
        if (AlreadyExistFiles.includes(fullPath)) {
            // console.log("not need to add this file to fileList it already present in the db ",fullPath);
            return;
        }
        // if (stat.isDirectory() && path.basename(fullPath) == 'Images') {
        //     console.log("nothing to do");
        //     return;
        // }
        else if (stat.isDirectory() && path.basename(fullPath) !== 'Images') {
            console.log("folder name ", file);
            await getAllFilesInDirectoryToDB(path.join(directoryPath, file), fileList)
        }

        else if (file !== '.gitkeep' && file !== 'favourite.svg' && file !== 'favourite2.svg' && file !== 'pause-solid.svg' && file !== 'play-solid.svg' && file !== 'rotate-solid.svg' && file !== 'download-solid.svg' && file !== 'x-button.png' && !file.toString().startsWith('.')) {
            const extension = path.extname(file)
            if (extension == '' || extension == null || extension === undefined) {
                console.log("extension is empty");
                console.log("file list ext ", fileList);
                return;
            }
            const id = generateRandomId(file.length)
            normalizedPath = fullPath.replace(/\\/g, '/');
            const removedWord = 'assets'
            let updatedPath = normalizedPath.split(removedWord);
            updatedPath = `../assets${updatedPath[1]}`;
            extension1 = path.extname(file);
            fileList.push({
                id: id,
                name: file.split('.')[0], markFavourite: false, ext: [extension1],
                isBothCharacterFile: false, img: `../assets/x-button.png`,
                tags: [file.split('.')[0]], src: [updatedPath], fullPath: [fullPath]
            });
        }
    }
    // files.forEach(addFileToMetadata);
    for (const file of files) {
        await addFileToMetadata(file);
    }
    console.log("final file List ", fileList);
    return fileList;
}


// async function getAllFilesInDirectoryToDB(directoryPath, fileList = []) {
//     const files = fs.readdirSync(directoryPath);
//     const AlreadyExistFiles=await getFilesSrcMetadata();

//     function addFileToMetadata(file) {
//         const fullPath = path.join(directoryPath, file);
//         const stat = fs.statSync(fullPath);
//         if(AlreadyExistFiles.includes(fullPath)){
//             console.log("not need to add this file to fileList it already present in the db ",fullPath);
//             return;
//         }
//         if (stat.isDirectory() && path.basename(fullPath) == 'Animations') {
//             getAllFilesInDirectoryToDB(path.join(directoryPath, file), fileList)
//         }
//         if (stat.isDirectory() && path.basename(fullPath) == 'Images') {
//             console.log("nothing to do");
//             return;
//         }

//         else if (file !== '.gitkeep' && file !== 'favourite.svg' && file !== 'favourite2.svg' && file !== 'pause-solid.svg' &&file !== 'play-solid.svg'&&file !== 'rotate-solid.svg' &&file !== 'download-solid.svg' && file !== 'x-button.png' && !file.toString().startsWith('.')) {
//             const extension = path.extname(file)
//             if (extension == '' || extension == null || extension === undefined) {
//                 console.log("extension is empty");
//                 console.log("file list ext ", fileList);
//                 return;
//             }
//             const id = generateRandomId(file.length)
//             normalizedPath = fullPath.replace(/\\/g, '/');

//             let updatedPath = normalizedPath.substring(directoryPath.length) //length //directoryPath.length
//             updatedPath = '../assets/Animations' + updatedPath;
//             console.log("file list ", fileList);
//             extension1 = path.extname(file);
//             fileList.push({
//                 id: id,
//                 name: file.split('.')[0], markFavourite: false, ext: [extension1],
//                 isBothCharacterFile: false, img: `../assets/x-button.png`,
//                 tags: [file.split('.')[0]], src: [updatedPath],fullPath:[fullPath]
//             });
//         }
//     }
//     files.forEach(addFileToMetadata);

//     return fileList;
// }

function getAllFilesInDirectory(directoryPath, format = "", isBothAnimation = false, fileList = []) {
    console.log("directory path  ", directoryPath);
    const files = fs.readdirSync(directoryPath);
    function addFileToMetadata(file) {
        const fullPath = path.join(directoryPath, file);
        // if (arguments.length == 2) {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && path.basename(fullPath) == 'Animations') {
            getAllFilesInDirectory(path.join(directoryPath, file), fileList)
        }
        if (stat.isDirectory() && path.basename(fullPath) !== 'Animations') {
            console.log("nothing to do ");
            return;
            // nothing to do 
        }
        // else if (file !== '.gitkeep' && file !== 'favourite.svg' && file !== 'favourite2.svg' && file !== 'x-button.png' && !file.toString().startsWith('.')) {
        //     const extension = path.extname(file)
        //     // const extension = path.extname(file);
        //     if (extension == '' || extension == null || extension === undefined) {
        //         console.log("extension is empty");
        //         return;
        //     }
        //     const id = generateRandomId(file.length)
        //     normalizedPath = fullPath.replace(/\\/g, '/');
        //     console.log("normalized path ", normalizedPath);
        //     let updatedPath = normalizedPath.substring(length) //length //directoryPath.length
        //     console.log("updated Path ", updatedPath);
        //     updatedPath = '../assets/Animations' + updatedPath;
        //     extension1 = path.extname(file);
        //     fileList.push({
        //         id: id,
        //         name: file.split('.')[0], markFavourite: false, ext: [extension1],
        //         isBothCharacterFile: false, img: `../assets/x-button.png`,
        //         tags: [file.split('.')[0]], src: [updatedPath]
        //     });
        // }
        // }
        // console.log("fullPath ", fullPath)
        // const stat = fs.statSync(fullPath);
        // if (stat.isDirectory() && path.basename(fullPath) !== 'Animations') {
        //     getAllFilesInDirectory(path.join(directoryPath, file), fileList)
        // }
        // if (stat.isDirectory() && path.basename(fullPath) == 'Animations') {
        //     getAllFilesInDirectory(path.join(directoryPath, file), fileList)
        // }
        // if (stat.isDirectory() && path.basename(directoryPath) == 'Images') {
        //     // getAllFilesInDirectory(path.join(directoryPath,file),fileList)
        // }
        else if (file !== '.gitkeep' && file !== 'favourite.svg' && file !== 'favourite2.svg' && file !== 'x-button.png' && !file.toString().startsWith('.')) {
            const extension = path.extname(file)
            if (extension == '' || extension == null || extension === undefined) {
                console.log("extension is empty");
                return;
            }
            else if (isBothAnimation && format == "All") {
                console.log("all format")
                const id = generateRandomId(file.length)
                normalizedPath = fullPath.replace(/\\/g, '/');
                // console.log("normalized path ", normalizedPath);
                let updatedPath = normalizedPath.substring(directoryPath.length);
                // let updatedPath = normalizedPath.substring(length) //length //directoryPath.length
                // console.log("updated Path ", updatedPath);
                updatedPath = '../assets/Animations' + updatedPath;
                extension1 = path.extname(file);
                fileList.push({
                    id: id,
                    name: file.split('.')[0], markFavourite: false, ext: [extension1],
                    isBothCharacterFile: true, img: `../assets/x-button.png`,
                    tags: [file.split('.')[0]], src: [updatedPath]
                    // files: [{
                    //         id:id,
                    //         name: file.split('.')[0], markFavourite: false, ext: [extension1],
                    //         isBothCharacterFile: true, img: `../assets/x-button.png`,
                    // }]//src: [fullPath]
                });
            }
            else if (isBothAnimation && extension == format && format !== "All") {
                const id = generateRandomId(file.length)
                console.log("came to not all format")
                normalizedPath = fullPath.replace(/\\/g, '/');
                // console.log("normalized path ", normalizedPath);
                let updatedPath = normalizedPath.substring(directoryPath.length) //length //directoryPath.length
                // console.log("updated Path ", updatedPath);
                updatedPath = '../assets/Animations' + updatedPath;
                extension1 = path.extname(file);
                fileList.push({
                    id: id,
                    name: file.split('.')[0], markFavourite: false, ext: [extension1],
                    isBothCharacterFile: true, img: `../assets/x-button.png`,
                    tags: [file.split('.')[0]], src: [updatedPath]
                });
            }
            else if (format == "All" && !isBothAnimation) {
                const id = generateRandomId(file.length)
                normalizedPath = fullPath.replace(/\\/g, '/');
                console.log("normalized path ", normalizedPath);
                let updatedPath = normalizedPath.substring(directoryPath.length) //length //directoryPath.length
                console.log("updated Path ", updatedPath);
                updatedPath = '../assets/Animations' + updatedPath;
                extension1 = path.extname(file);
                fileList.push({
                    id: id,
                    name: file.split('.')[0], markFavourite: false, ext: [extension1],
                    isBothCharacterFile: false, img: `../assets/x-button.png`,
                    tags: [file.split('.')[0]], src: [updatedPath]
                });
            }
            else if (extension == format && format !== "All" && !isBothAnimation) {
                const id = generateRandomId(file.length)
                normalizedPath = fullPath.replace(/\\/g, '/');
                console.log("normalized path ", normalizedPath);
                let updatedPath = normalizedPath.substring(directoryPath.length) //length //directoryPath.length
                console.log("updated Path ", updatedPath);
                updatedPath = '../assets/Animations' + updatedPath;
                extension1 = path.extname(file);
                fileList.push({
                    id: id,
                    name: file.split('.')[0], markFavourite: false, ext: [extension1],
                    isBothCharacterFile: false, img: `../assets/x-button.png`,
                    tags: [file.split('.')[0]], src: [updatedPath]
                });
            }
            // else {
            //     const id = generateRandomId(file.length)
            //     normalizedPath = fullPath.replace(/\\/g, '/');
            //     console.log("normalized path of else ", normalizedPath);
            //     let updatedPath = normalizedPath.substring(directoryPath.length) //length //directoryPath.length
            //     updatedPath = '../assets/Animations' + updatedPath;
            //     console.log("updated Path ELSE ", updatedPath);
            //     console.log("file list ", fileList);
            //     extension1 = path.extname(file);
            //     fileList.push({
            //         id: id,
            //         name: file.split('.')[0], markFavourite: false, ext: [extension1],
            //         isBothCharacterFile: false, img: `../assets/x-button.png`,
            //         tags: [file.split('.')[0]], src: [updatedPath]
            //     });
            // }
        }
    }
    files.forEach(addFileToMetadata);
    return fileList;
}

app.get("/files", async (req, res) => {
    try {
        const Files = await fileModel.find({ "isBothCharacterFile": false }).exec();
        // { "isBothCharacterFile": false }).exec();
        if (!Files)
            res.status(500).json({ error: "No files Exist in Database " })
        else {
            console.log("Data from the files ", Files)
            res.status(200).json(Files);
        }
    } catch (err) {
        console.log("Error occured can't get files to Mognodb ", err)
        res.status(500).json({ error: "Error occured while getting files to Mongodb: ", err });
    }
})
app.get("/bothAnimationFiles", async (req, res) => {
    try {
        const Files = await fileModel.find({ "isBothCharacterFile": true }).exec();
        if (!Files)
            res.status(500).json("No files exist in the Database ")
        else {
            console.log("both animatin files ", Files);
            res.status(200).json(Files);
        }
    } catch (err) {
        console.log("Error occured can't get files to Mognodb ", err)
        res.status(500).json({ error: "Error occured while getting files to Mongodb: ", err });
    }
})
const length = directoryPath.length;
app.get('/files/data/:data', async (req, res) => {
    let data = req.params.data;  //because route parameter treated as string so it true or false as string and not as boolean
    data = JSON.parse(data);
    const count = await fileCollection.countDocuments({})
    if (count == 0 || data == true) {
        const allFiles = await getAllFilesInDirectoryToDB(directoryPath);
        console.log("all Files ", allFiles);
        try {
            if (allFiles) {
                for (const item of allFiles) {
                    const file = new fileModel(item);
                    await file.save();
                }
                // console.log("All Files saved in the MongoDB: ", allFiles)
            }
            res.json(allFiles);
        }
        catch (err) {
            console.log("Error occured can't save files to Mognodb ", err)
            res.status(500).json({ error: "Error occured while savibng files to Mongodb: ", err });
        }
    } else {  // if (db.files.stats().count != 0) {
        // Not add any data 
    }
    // console.log("src form the angular ", directoryPath);
    // const allFiles = getAllFilesInDirectory(directoryPath);
    // console.log("all files from the localhost ", allFiles);
    // // }
    // try {
    //     if (allFiles) {
    //         for (const item of allFiles) {
    //             const file = new fileModel(item);
    //             await file.save();
    //         }
    //         // console.log("All Files saved in the MongoDB: ", allFiles)
    //     }
    //     res.json(allFiles);
    // }
    // catch (err) {
    //     console.log("Error occured can't save files to Mognodb ", err)
    //     res.status(500).json({ error: "Error occured while savibng files to Mongodb: ", err });
    // }
})



// read selected file when user click on the file
app.get('/files/:filename', async (req, res) => {
    const fileName = req.params.filename;
    console.log("filename ", fileName);
    try {
        // Find data in the database based on a property (e.g., name)
        const fileData = await fileModel.findOne({ name: fileName });
        console.log("File data found ", fileData);
        if (!fileData) {
            return res.status(404).json({ error: 'File not found in the database.' });
        }
        // Send the file data as a response
        res.status(200).json({ fileData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error querying the database.' });
    }
});
app.listen(PORT, async () => {
    // getFilesSrcMetadata();
    console.log(`Server listening at ${PORT}`)
})

