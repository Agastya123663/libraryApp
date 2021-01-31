import React from "react"
import {Text,TouchableOpacity,StyleSheet,View,TextInput,Image,KeyboardAvoidingView, Alert} from "react-native"
import * as Permissions from "expo-permissions"
import {BarCodeScanner} from "expo-barcode-scanner"
import db from "../config"
import firebase from 'firebase'
import { abs } from "react-native-reanimated"


export default class BookTransactionScreen extends React.Component{
    constructor(){
        super();
        this.state={
            hasCameraPermissions : null,
            scannned : false,
            scannedBookId : "",
            scannedStudentId : "",
            buttonState : "normal",
            transactionMessage : ""

        }
    }

    checkStudentEligibilityForBookIssue=async()=>{
        const studentRef = await db.collection("students").where("studentId","==",this.state.scannedStudentId).get();
        console.log(studentRef);
        var isStudentEligible = ""
        if(studentRef.docs.length == 0){
            isStudentEligible = false;
            Alert.alert("This Student doesn't exist")
            console.log("This Student doesn't exist")
            this.setState({
                scannedStudentId : '',
                scannedBookId : '',
            })
        }
        else{
            studentRef.docs.map((doc)=>{
                var student = doc.data();
                if(student.noOfBooksIssued<2)
                {
                    isStudentEligible  = true;
                }
                else
                {
                    isStudentEligible = false;
                    Alert.alert("This student has 2 books issued already")
                    console.log("This student has 2 books issued already")
                    this.setState({
                        scannedStudentId : '',
                        scannedBookId : '',
                    })
                }
            })
        }
        return isStudentEligible ;
    }

    checkStudentEligibilityForBookReturn=async()=>{
        const transactionRef = await db.collection("transactions").where("bookId","==",this.state.scannedBookId).limit(1).get()
        var isStudentEligible = ""
        transactionRef.docs.map((doc)=>{
            var lastBookTransaction = doc.data()
            if(lastBookTransaction.studentId === this.state.scannedStudentId)
            {
                isStudentEligible = true
            }
            else{
                isStudentEligible = false
                Alert.alert("The book wasn't issued by this student")
                console.log("The book wasn't issued by this student")
                this.setState({
                    scannedStudentId : '',
                    scannedBookId : '',
                })
            }
        })
        return isStudentEligible;
    }



    handleTransaction=async()=>{
        var transactionType = await this.checkBookEligibility();

        if(!transactionType){
            Alert.alert("This book doesn't exist");
            this.setState({
                scannedStudentId : '',
                scannedBookId : '',
            })
        }
        else if(transactionType === "issue"){
            var isStudentEligible = await this.checkStudentEligibilityForBookIssue()
            if(isStudentEligible){
                this.initiateBookIssue();
                Alert.alert("Book Issued")
            }
        }
        else{
            var isStudentEligible = await this.checkStudentEligibilityForBookReturn();
            if(isStudentEligible){
                this.initiateBookReturn();
                Alert.alert("Book Returned")
            }

        }
    }

    checkBookEligibility=async()=>{
        const bookRef = await db.collection("books").where("bookId","==",this.state.scannedBookId).get()
        var transactionType = ""
        if(bookRef.docs.length === 0)
        {
            transactionType = false
            console.log("Information about book is not found in the database")

        }
        else
        {
            bookRef.docs.map((doc)=>{
                var book = doc.data();
                console.log(book)
                if(book.bookAvailability){
                    transactionType = "issue"
                }
                else{
                    transactionType = "return"
                }
            })
        }
        return transactionType
    }




    initiateBookIssue=async()=>{
        // adding transaction data
        db.collection("transactions").add({
            "studentId" : this.state.scannedStudentId,
             "bookId" : this.state.scannedBookId,
             "date" : firebase.firestore.Timestamp.now().toDate(),
             "transactionType" : "issue"
        })
        //changing book status
        db.collection("books").doc(this.state.scannedBookId).update({
            "bookAvailability" : false
        })
        //changing no of books issued
        db.collection("students").doc(this.state.scannedStudentId).update({
            "noOfBooksIssued" : firebase.firestore.FieldValue.increment(1)
        })
    }

    initiateBookReturn=async()=>{
        // adding transaction data
        db.collection("transactions").add({
            "studentId" : this.state.scannedStudentId,
             "bookId" : this.state.scannedBookId,
             "date" : firebase.firestore.Timestamp.now().toDate(),
             "transactionType" : "return"
        })
        //changing book status
        db.collection("books").doc(this.state.scannedBookId).update({
            "bookAvailability" : true
        })
        //changing no of books issued
        db.collection("students").doc(this.state.scannedStudentId).update({
            "noOfBooksIssued" : firebase.firestore.FieldValue.increment(-1)
        })
    }



    getCameraPermissions=async(id)=>{
        const {status} = await Permissions.askAsync(Permissions.CAMERA)
        this.setState({
            hasCameraPermissions : status==="granted",
            buttonState : id,
            scannned:false,

        })
    }

    handleBarcodeScanned=async({type,data})=>{
        const {buttonState} = this.state
        if(buttonState === "BookId"){
            this.setState({
                scanned:true,
                scannedBookId:data,
                buttonState:"normal"
            })
        }   

        else if(buttonState === "StudentId"){
            this.setState({
                scanned:true,
                scannedStudentId:data,
                buttonState:"normal"
            })
        }
        
    }

    render(){
        const hasCameraPermissions = this.state.hasCameraPermissions
        const scanned = this.state.scannned
        const buttonState = this.state.buttonState

        if(buttonState==="clicked" && hasCameraPermissions){
            return(
                <BarCodeScanner onBarcodeScanned={scanned?undefined:this.handleBarcodeScanned}
                />
            )
        }
        else if(buttonState=="normal"){
            return(
                <KeyboardAvoidingView style={styles.container} behavior = "padding" enabled>
                    <View>
                        <Image source={require("../assets/booklogo.jpg")} style={{width:200,height:200}}/>
                        <Text style={{fontSize:20,textAlign:"center"}}>Willy</Text>
                    </View>

                    <View style={styles.inputView}>
                        <TextInput placeholder="book id" style={styles.inputBox} onChangeText={text=>this.setState({scannedBookId:text})} value={this.state.scannedBookId}></TextInput>
                        <TouchableOpacity onPress={()=>{this.getCameraPermissions("BookId")}} style={styles.scannedButton}>
                            <Text>Scan</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputView}>
                        <TextInput placeholder="student id" style={styles.inputBox} onChangeText={text=>this.setState({scannedStudentId:text})} value={this.state.scannedStudentId}></TextInput>
                        <TouchableOpacity onPress={()=>{this.getCameraPermissions("StudentId")}} style={styles.scannedButton}>
                            <Text>Scan</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={async()=>{var transactionMessage = await this.handleTransaction()}} style={styles.scannedButton}>
                    <   Text style={styles.buttonText}>Submit</Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            )
            
        }
        
    }
}

const styles = StyleSheet.create({
    container:{
        flex:1,
        justifyContent:"center",
        alignItems:"center"
    },
    displayText:{
        fontSize:15,
    },
    scannedButton:{
        backgroundColor:"blue",
        margin:10,
        padding:10,      
    },
    buttonText:{
        justifyContent:"center",
        textAlign:"center",
        fontSize:25
    },
    inputBox:{
        width:150,
        height:50,
        borderWidth:2,
        fontSize:20
    },
    inputView:{
        flexDirection:"row",
        margin:15
    }
})