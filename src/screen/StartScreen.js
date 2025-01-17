import React from 'react';

const StartScreen = ({ onStart }) => (
  <div>
    <h1>3人大富豪</h1>
    <button onClick={onStart}>スタート</button>
  </div>
);

export default StartScreen;