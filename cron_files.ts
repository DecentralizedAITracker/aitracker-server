var cron = require('node-cron');
import { promises as fsAsync } from "fs"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
let minute = 60*1000

let main = async () => {
    let files = await prisma.file.findMany({
        where : {
            timestamp : {
                lt : Date.now()-15*minute,
            }
        }
    })

    console.log(files)

    for(let e of files){
        try{
            await fsAsync.unlink('public/' + e.filename)
        }catch(e){
            console.log("file does not exist")
        }
        
        await prisma.file.delete({
            where : {
                id : e.id
            }
        })
    }
}

cron.schedule('*/5 * * * *', () => {
    main()
    console.log('running a task every 05 minutes');
  });