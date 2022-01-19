import React from 'react'
function getRandomNumber(number){
    return Math.floor(Math.random()*number)
}

class User {
    constructor(name, friends){
        this.name = name;
        this.friends = friends;
        this.crypto = getRandomNumber(5000);
        this.rentals = getRandomNumber(5000); 
        this.stocks = getRandomNumber(5000);
        this.other = getRandomNumber(5000); 
        this.friends = [];
    } 
}

const josh = new User('Josh', ['coral', 'mark', 'john'])

const UserHome = () => {
    return (
        <div style={{width: '200px', height:'200px', background:'red'}}>
            {josh.name}
            {josh.crypto}
            {josh.rentals}
            {josh.stocks}
            {josh.other}
        </div>
    )
}

export default UserHome;