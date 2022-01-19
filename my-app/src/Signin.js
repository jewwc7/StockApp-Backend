import React, { useState } from 'react';
import {Button} from "@material-ui/core"; //importing elements, can use destructuring
import SaveIcon from '@material-ui/icons/Save'; //importing icons, no desctruvturing
import {ButtonGroup} from '@material-ui/core' //button group aligns buttons togegther
import DeleteIcon from '@material-ui/icons/Delete'; //delete icon 
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import CloseIcon from '@material-ui/icons/Close';
import {Checkbox} from '@material-ui/core';  //checkbox
import {FormControlLabel} from '@material-ui/core'; //from contro. aligns checkbox and input. can I use with buttons?
import {TextField} from '@material-ui/core';  //input filed
import {makeStyles, ThemeProvider} from '@material-ui/core/styles';  //imported, initiates style object that you can use. Them provider allows you to change entire themeof project(secondary and primary colors etc). Wrap everything inside ThemeProvider. I did not use about the 25min mark. Make it easier to update entire page and keep things consistent
import {Snackbar} from "@material-ui/core"; //importing elements, can use destructuring
import {Typography} from '@material-ui/core';

export const Signin = () => {
    return (
        <div style={signinBody}> 
            {/* Comment goes here */}
            <Button onClick={()=>console.log('signIn')} variant='text'style={{top: '130px', left: '540px', color:'black'}}><CloseIcon/></Button>
            <div class="login-page" style={{marginTop: '150px'}}>
        <form class="login-form">
            <div style={userInfoStyle}>
        <TextField style={textfieldStyle} label="Username" variant="filled" onChange={(e)=>console.log('signIn')}/>
            <TextField style={textfieldStyle} label="Password" variant="filled"  onChange={(e)=>console.log('signIn')}/> 
            <Button style={btnStyle} variant='contained' endIcon={<NavigateNextIcon/>} onClick={()=>console.log('signIn')} >Sign In</Button>
            </div>
            <div style={notRegisStyle}>
            <Typography variant='h4'>Not registered?</Typography>
            <Button style={acctBtnStyle} variant='text'  onClick={()=>console.log('signIn')}>Create Account</Button>  
            </div>
        </form>
        </div>
        {/* Snackbar appears. open is a built in prop set value to openAlert(usestate from main app) */}
        <Snackbar  message='Invalid credentials try again or create an account' autoHideDuration={2000} >
        </Snackbar>
        </div>
         )
}




const btnStyle = {
    background: '#7ec8e3',
}

const acctBtnStyle = {
    color: '#7ec8e3',
    width: '140px',
    height: '40px',
    marginLeft:'20px'
}



const userInfoStyle = {
    position: 'relative',
  //  background:'red',
    display:'flex',
    justifyContent: 'space-between',
    width: '600px',
}
const textfieldStyle ={
    poistion:'relative',
    left: '20px',
    color: '#7ec8e3',
    background: 'black',
}

const notRegisStyle = {
    display: 'flex',
  //  flexDirection: 'column',
    marginTop: '20px',
    width:'600px',
   // background: 'red',
    //justifyContent: 'space-between',
    paddingLeft: '25px'
}
const signinBody = {
    position: 'relative',
    height: '750px',
    width: '750px',
    background: '#000c66',
    top: '-150px'
}

export default Signin;