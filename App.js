import express, { json } from 'express';
import axios from 'axios';
import { createClient } from 'redis';


let app = express();
const client = createClient({
    url: 'redis://localhost:6379' // updated to use a URL for connection
});
client.on('error', err => console.log(`Redis client error`, err));

app.get('/data', async (req, res) => {

    try {
        await client.connect();
        let userInput = req.query.country.trim();

        const url = `https://en.wikipedia.org/w/api.php?action=parse&format=json&section=0&page=${userInput}`;
        let response = await client.get(userInput); //checking in redis****** redis store the data by key here userInput is the key value
        if (response) {
            const output = JSON.parse(response);//if response is ok we get from redis
            res.send(output)
        } else {
            let apiresponse = await axios.get(url);
            let output = apiresponse.data;
            await client.set(userInput, JSON.stringify({ source: 'Redis Cache', output }), { EX: 5000, NX: true })
            res.send({ source: 'Api Response', output })

        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Server Error');
    }finally{
        await client.disconnect()
    } 

})



app.listen(3333, () => {

    console.log('Server is running on port 3333');
})