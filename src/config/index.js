require("dotenv").config()

module.exports = {
dsn:`mongodb+srv://${process.env.dbusername}:${process.env.dbpassword}@atlascluster.d1wqjsq.mongodb.net/?retryWrites=true&w=majority`
}
