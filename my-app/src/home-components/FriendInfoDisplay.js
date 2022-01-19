import React from "react";
import { Grid, Button, Snackbar } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import axios from "axios";

const FriendInfoDisplay = ({ avatar, currentUserObject }) => {
  const { name, reaction, likes, myComments, pic } = avatar; //destructuring
  const classes = useStyles();
  //removing friend, passing avatar(friend) object and currentUser object
  async function removeFriend(avatar) {
    console.log(avatar);
    let request = axios.put("/deleteFriend", { currentUserObject, avatar });
    let response = await request.data;
    console.log(response);
  }

  return (
    <Grid container className={classes.root} wrap="nowrap">
      <Grid item>
        <img src={pic} alt="Avatar" className={classes.img}></img>
      </Grid>
      <Grid
        className={classes.stats}
        style={{ background: "" }}
        item
        container
        direction="column"
      >
        <Grid item style={{ margin: "0px" }}>
          <h2>{name}</h2>
        </Grid>
        <Grid
          item
          container
          justify="space-between"
          style={{ position: "relative", width: "150px" }}
        >
          <Grid item>
            {reaction}
            <p className={classes.smallPara}>Reactions</p>
          </Grid>
          <Grid item>
            {likes}
            <p className={classes.smallPara}>Likes</p>
          </Grid>
          <Grid item>
            {myComments !== undefined ? myComments.length : "0"}
            <p className={classes.smallPara}>comments</p>
          </Grid>
        </Grid>
      </Grid>
      <Button
        variant="text"
        className={classes.btn}
        onClick={() => removeFriend(avatar)}
      >
        Remove
      </Button>
    </Grid>
  );
};

//add a button to top right corner, remove friend?
const useStyles = makeStyles({
  root: {
    width: "325px",
    background: "#000c66",
    //   background: 'yellow',
    postiion: "relative",
    borderRadius: "20%",
  },
  img: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    margin: "10px 20px",
  },
  smallPara: {
    fontSize: "8px",
  },
  stats: {
    lineHeight: "8px",
  },
  btn: {
    position: "absolute",
    width: "",
    left: "350px",
    fontSize: "8px",
  },
});

export default FriendInfoDisplay;
