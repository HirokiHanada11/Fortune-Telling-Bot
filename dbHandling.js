//mongodb storing data to slackAppUsers database
const storeUserInfoMethod = async (id, username, horoscope, url, dbName, dbclient) =>{
    try {
        const slackAppUsersdb = dbclient.db(dbName);
        // Use the collection "users"
        const usersCol = slackAppUsersdb.collection("users");
        // Construct a document                                                                                                                                                              
        let userDocument = {
            "id": id,
            "username": username,                                                                                                                               
            "horoscope": horoscope,                                                                                                                               
            "favPhoto": url
        }
    //query to check if the data does not exist in the database
    let query = { "id": id };
    //if data does not exist
    let userDoc = await usersCol.findOne(query);
        if(await userDoc === null){
            // Insert a single document, wait for promise so we can read it back
            const p = await usersCol.insertOne(userDocument);
            // Find one document
            let userDoc = await usersCol.findOne(query);
            // Print to the console
            console.log("Inserted\n", userDoc);
        }else {//if the the data exists, update
            let newUrlArr = await userDoc.favPhoto.concat(url) 
            let updateUserDocument = await {
            $set: {
                "horoscope": horoscope,                                                                                                                                   
                "favPhoto": newUrlArr
            }
            }
            //update one element 
            const q = await usersCol.updateOne(query, updateUserDocument);
            // Find one document
            let myDoc = await usersCol.findOne();
            // Print to the console
            console.log("Updated\n", myDoc);
        }
    } catch (err) {
      console.log(err.stack);
    }
}

//delete selected urls
const deleteUserInfoMethod = async (id, urlArr, dbName, dbclient) =>{
    try {
        const slackAppUsersdb = dbclient.db(dbName);
        // Use the collection "users"
        const usersCol = slackAppUsersdb.collection("users");
        //query to check if the data does not exist in the database
        let query = { "id": id };
        //if data does not exist
        let checkedUrls = await mapVals(urlArr);
        let userDoc = await usersCol.findOne(query);
        let newUrlArr = await filterArr(userDoc.favPhoto, checkedUrls); 
        console.log(newUrlArr);
        let updateUserDocument = {
            $set: {                                                                                                                                   
            "favPhoto": newUrlArr
            }
        }
        //update one element 
        const q = await usersCol.updateOne(query, updateUserDocument);
        // Find one document
        let myDoc = await usersCol.findOne();
        // Print to the console
        console.log("Updated to\n", myDoc);
    } catch (err) {
      console.log(err.stack);
    }
  }

//map object to url
const mapVals = async (arrObj) => {
    return arrObj.map(obj => obj.value);
}
//filter function 
const filterArr = async (arr1, arr2) => {
    console.log(arr1);
    console.log(arr2);
    return arr1.filter(url => !(arr2.includes(url)));
}

module.exports = {
    storeUserInfo: storeUserInfoMethod,
    deleteUserInfo: deleteUserInfoMethod
}