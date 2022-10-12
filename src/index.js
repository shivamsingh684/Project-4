const express = require('express');
const route =require("./routes/route.js");
const mongoose  = require('mongoose');
const app = express();

app.use(express.json()); 


mongoose.connect("mongodb+srv://ritikkohli:eJ9TDANLzfmCixVu@cluster0.gd4mqlp.mongodb.net/group50Database", {
    useNewUrlParser: true
})
.then( () => console.log("MongoDb is connected"))
.catch ( err => console.log(err) )

app.use('/', route);



app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});

 