const fs = require("fs");

const stateFolder = "storage/state"
const saveFilePath = "app-state.json";

exports.save = (userName, data) => {
    if (!fs.existsSync(stateFolder)) {
        fs.mkdirSync(stateFolder);
    }
    fs.writeFileSync(`${stateFolder}/${userName}-${saveFilePath}`, JSON.stringify(data));
}

exports.load = (userName) => {
    const data = fs.readFileSync(`${stateFolder}/${userName}-${saveFilePath}`, "utf-8");
    return JSON.parse(JSON.stringify(data));
}

exports.isExists = (userName) => {
    return fs.existsSync(`${stateFolder}/${userName}-${saveFilePath}`);
}

exports.delete = (userName) => {
    return fs.unlinkSync(`${stateFolder}/${userName}-${saveFilePath}`);
}