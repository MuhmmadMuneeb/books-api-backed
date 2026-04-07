import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()


export const autherization = (req, res, next) => {
    try {
        const bearerHeader = req.headers["authorization"]
        console.log(bearerHeader)
        if (!bearerHeader) {
            return res.status(401).json({ message: "no token provided" })
        }
        const Token = bearerHeader.split(" ")[1]
        if (!Token) {
            return res.status(401).json({ message: "invalid token format" })
        }

        const decoded = jwt.verify(Token, process.env.SECRET_KEY)
        console.log(decoded)
        req.user = decoded
        next()
    } catch (error) {
        console.error("autherization error", error)
        return res.status(500).json({ message: "unautherizad" })
    }
}
export const checkAdmin = (req, res, next) => {
  if (req.user.username==="munb") {
   next()
  } else {
    res.status(401).json({ message: "admin only allowed" })
  }
}