const mongoose = require("mongoose");
const validator = require("validator");
const { boolean } = require("webidl-conversions");

const fileSchema = new mongoose.Schema({
    id: String,
    name: String,
    markFavourite: Boolean,
    isBothCharacterFile: Boolean,
    img: String,
    ext: [String],
    src: {
        type: [String],
    },
    tags: [String],
    fullPath:{type:[String]}
}, { strict: false })

const playlistWithFiles = new mongoose.Schema({
    name: String,
    files: [{}]
});
const playlistSchema = new mongoose.Schema({
    name: String,
    files: [{
    }],
    BothCharacters: [{
        name: {
            type: String
        },
        id: String,
        markFavourite: Boolean,
        isBothCharacterFile: Boolean,
        img:String,
        tags: [String],
        src:[String],
        fullPath:[String],
        ext:[String],
        files: [{
        }]
    }]
})
// { strict: false })
const fileModel = mongoose.model("files", fileSchema)
const playlistModel = mongoose.model("Playlist", playlistSchema, "playlist");
const playlistWithFilesModel = mongoose.model("PlaylistWithFile", playlistWithFiles, "playlist");
module.exports = {
    fileModel,
    playlistModel,
    playlistWithFilesModel
};