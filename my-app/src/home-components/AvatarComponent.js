import React, {useState,useEffect} from 'react'
import { Avatar, Grid} from '@material-ui/core';
import { AvatarGroup } from '@material-ui/lab';
import FriendInfoDisplay from './FriendInfoDisplay';


//map through the passed in obj array and place each items.pic to an avatar
const AvatarComponent = ({currentUserObject}) =>{

     const [avatarInfo, setAvatarInfo] = useState({});
    const [avatarInfoDisplay, setAvatarInfoDisplay] = useState(false)

   
     //shows the div on hover. Showing friends(avatar) details
    function showFriendDeatails(avatar){
        const {name, reaction, likes, myComments} = avatar; //destructuring
     return (
         <div style={{width:'400px', marginTop:'10px', postion:'relative'}}>
            <FriendInfoDisplay currentUserObject={currentUserObject} avatar={avatar}/>
         </div>  //left off make the box look good, also use grid instead of div or use grid inside of div
     )
    }
  
     
    function showAvatarInfo(customer){
        setAvatarInfo(customer)  //setInfo to avatar as customer/person object
        setAvatarInfoDisplay(true)  //set the display to true
    }

    return (
    <Grid container item direction='row' wrap='nowrap'  spacing={3}>
        <Grid item><p>{`${currentUserObject.username}'s friends`}</p></Grid>
        <Grid item>
          <AvatarGroup>
            {currentUserObject.myCustomers.map(customer=>{                 {/* on mouse enter(hover) passed the current hovered customer object to function. FUnction updates states. On mouseleave set displayinfo to false, hook deterines if div displayed or not*/}
              return <Avatar onMouseEnter={()=>{showAvatarInfo(customer)}}   src={customer.pic}></Avatar>
            })}
          </AvatarGroup>
          <div>{avatarInfoDisplay ? showFriendDeatails(avatarInfo): false}</div> {/* pass in the current avatarInfo(useState) to the function*/}
        </Grid>
    </Grid>
    )
}

export default AvatarComponent;

//onMouseLeave={()=>setAvatarInfoDisplay(false)}