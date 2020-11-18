const express = require("express");
const bodyParser = require('body-parser');
const JsonDB = require('node-json-db').JsonDB;
const Config = require('node-json-db/dist/lib/JsonDBConfig').Config;
const uuid = require("uuid");
const speakeasy = require("speakeasy");

const app = express();
const db=new JsonDB(new Config('myDatabase',true,false,'/'))
app.use(express.json)
//Register user & create temporary secret

app.post('/api/register',(req,res)=>{
    const id=uuid.v4()
    try{
        const path=`/user/${id}`
        const temp_secret=speakeasy.generateSecret()
        db.push(path,{id,temp_secret})
        res.json({id,secret:temp_secret.base32})
        
    }catch(error){
        console.error(error)
        res.status(500).json({message:'Error generating the secret'})


    }
})


// Verify Token and make secret permanent

app.post('/api/verify',(req,res)=>{
    const {token,userId}=req.body
    try{
        const path=`/user/${userID}`
        const user=db.getData(path)

        const {base32:secret}= user.temp_secret
        const verified = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token
          })
          if (verified) {
            // Update user data
            db.push(path, { id: userId, secret: user.temp_secret });
            res.json({ verified: true })
          } else {
            res.json({ verified: false})
          }

    }catch(error){
        console.error(error);
    res.status(500).json({ message: 'Error retrieving user'})

    }
})

app.post("/api/validate", (req,res) => {
    const { userId, token } = req.body;
    try {
      // Retrieve user from database
      const path = `/user/${userId}`;
      const user = db.getData(path);
      console.log({ user })
      const { base32: secret } = user.secret;
      // Returns true if the token matches
      const tokenValidates = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 1
      });
      if (tokenValidates) {
        res.json({ validated: true })
      } else {
        res.json({ validated: false})
      }
    } catch(error) {
      console.error(error);
      res.status(500).json({ message: 'Error retrieving user'})
    };
  })

const PORT=process.env.PORT||5000
app.listen(PORT,()=>console.log(`Server running on port ${PORT}`))