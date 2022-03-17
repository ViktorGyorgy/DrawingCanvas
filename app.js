const express = require('express')
const app = express()
const port = 25565

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use(express.static('public'))

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})