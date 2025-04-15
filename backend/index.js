require("dotenv").config();
const { mongoose } = require("mongoose");
const express = require("express");
const app = express();
const cors = require('cors');
app.use(cors());

const { userRouter } = require("./routes/user");
const { adminRouter } = require("./routes/admin");
app.use(express.json());

app.use("/user", userRouter);
app.use("/admin", adminRouter);

async function main(){
    await mongoose.connect(process.env.MONGO_DB_URL,{
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    console.log("Database Connected")
    app.listen(process.env.port);
    console.log("Listening on port 3000");
}

main()
