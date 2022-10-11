class Utils {
    static  delay(time){
        return new Promise(resolve => setTimeout(resolve, time)); 
    }
}

export {Utils}