import { TextField, Typography, GridList, GridListTile, GridListTileBar, Paper, makeStyles } from '@material-ui/core';
import React, {useState, Fragment, useReducer} from 'react';
import {Button} from "@material-ui/core"; //importing elements, can use destructuring
import SaveIcon from '@material-ui/icons/Save'; //importing icons, no desctruvturing
import {ButtonGroup} from '@material-ui/core' //button group aligns buttons togegther
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import CloseIcon from '@material-ui/icons/Close';
import {Container} from '@material-ui/core';  
import {IconButton} from '@material-ui/core'
//import 'fontsource-roboto'; //importing typorgrapyh, had to install via CL first npm install fontsource-roboto
import {Snackbar} from "@material-ui/core"; //importing elements, can use destructuring
import {Grid} from '@material-ui/core';


 const Register = () => {
    return (
        <Fragment>
        <Container maxWidth='lg'>
        <Typography>
        <Button onClick={()=>console.log('exit')} variant='text' color='secondary'  style={{top: '0px', left: '540px', fontSize:'18px'}}>X</Button>
        <div class="form">
        <form >
        <Grid container spacing={4}>
          <Grid item>
            <TextField variant='standard'type="text" placeholder="username" onChange={(e)=> console.log(e.target.value)} ></TextField>
          </Grid>
          <Grid item>
            <TextField variant='standard' type="password" placeholder="password" onChange={(e)=> console.log(e.target.value)}></TextField>
          </Grid>
          <Grid item>
            <Button variant='contained' endIcon={<NavigateNextIcon/>} onClick={()=>console.log('create Account')}>Create Account</Button> 
          </Grid>
      </Grid>
      </form>
      <Grid container spacing={2}>
        <Grid item>
      <Typography variant='h4'>Already registered?</Typography>
         </Grid>
         <Grid item>
          <Button color='primary' variant='contained'>Sign In</Button>  
         </Grid>
       </Grid>
        </div>
        </Typography>
        </Container>
        <Snackbar  message='User already exist' autoHideDuration={6000} >
      </Snackbar>

    </Fragment>
    )
}

export default Register