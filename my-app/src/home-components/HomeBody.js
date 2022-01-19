import React from 'react'
import UserHome from '../user-components/UserHome';
import stockPeople from '../Photos/stockpeople.jpg';
import { TextField, Typography, Grid, Button, makeStyles, ButtonGroup} from '@material-ui/core';
import ShowChartIcon from '@material-ui/icons/ShowChart';
import MonetizationOnIcon from '@material-ui/icons/MonetizationOn';
import HouseIcon from '@material-ui/icons/House';
import CloseIcon from '@material-ui/icons/Close';
import UserProfile from './UserProfile';



const currentUserObject ={
    name: 'Johhny',
    pic: stockPeople,
    reaction: 75,
    likes: 55,
    stocks: 41,
    crypto: 23,
    rental: 500
}

export const HomeBody = () => {
    return (
        <div style={{position:'relative', width:'100%', display:'flex' }}>
             <UserProfile currentUserObject={currentUserObject}/>
            <HomeInfo/>
        </div>
    )
}


const HomeInfo = () =>{
    const classes = useStyles()

    return (
        <div style={{width: '600px', height:'400px', marginTop: '20px', position:'relative'  }}>
            <Button style={{position:'absolute', right:'0px'}}><CloseIcon/></Button>
            <Grid container direction='column' wrap='nowrap' style={{backgroundColor:'#F8F8FF', width:'100%', height:'350px', border:'2px solid white',postion:'relative' }}>
                <Grid container item direction='row' wrap='nowrap'  style={{margin:'20px 10px',postion:'relative'}} >
                  
                    <Grid direction='column' item container style={{background:'',height:'170px'}} >
                        <Grid item className={classes.img}><img src={currentUserObject.pic} alt='ME' className={classes.img} ></img></Grid> 
                    </Grid>

                    <Grid item container direction='column' >
                       <Grid item ><h2 style={{color:'',textAlign:'center', marginTop:'0px'}}>{currentUserObject.name}</h2></Grid>
                      
                       <Grid item container direction='row' wrap='nowrap'>
                            <Grid item container direction='column'> 
                                <Grid item><h3>Stocks</h3></Grid>
                                <Grid item><ShowChartIcon/></Grid>
                                <Grid item><p>{currentUserObject.stocks}%</p></Grid>
                            </Grid>
                            <Grid item container direction='column'>
                                <Grid item><h3>Crpyto</h3></Grid>
                                <Grid item><MonetizationOnIcon/></Grid>
                                <Grid item><p>{currentUserObject.crypto}%</p></Grid>
                            </Grid>
                            <Grid item container direction='column'>
                                <Grid item><h3>Rentals</h3></Grid>
                                <Grid item><HouseIcon/></Grid>
                                <Grid item><p>${currentUserObject.rental} Cash</p></Grid>
                            </Grid>
                       </Grid>
                
                    </Grid>
                 </Grid>
                
                 <Grid  direction='column' item container style={{marginTop:'',background:'',width:'100%', height:'100%',margin:'20px 10px',postion:'relative',}} >   

                            <Grid item ><h2>Philosphy</h2></Grid>
                            <Grid item style={{marginTop:'-25px'}}><p>Philosophy is at once the most sublime and the most trivial of human pursuits</p></Grid>
                 </Grid>
                            

             </Grid>
        </div>
    )
}

const useStyles = makeStyles({
    img:{
        width: '90%',
        height: '100%',
    },
    iconSpan:{
        color:'#FF4500'
    }
})

//<ButtonGroup orientation='vertical' >
//<Grid item><Button variant='contained'  size='small' >Add Friend</Button></Grid> 
//<Grid item><Button  color='primary' variant='outlined'  size='small' >See Profile</Button></Grid> 
//</ButtonGroup>


export default HomeBody;