import React from 'react';
const marks = {
  '011': '♤3',
  '012': '♢3',
  '013': '♡3',
  '021': '♤4',
  '022': '♢4',
  '023': '♡4',
  '031': '♤5',
  '032': '♢5',
  '033': '♡5',
  '041': '♤6',
  '042': '♢6',
  '043': '♡6',
  '051': '♤7',
  '052': '♢7',
  '053': '♡7',
  '061': '♤8',
  '062': '♢8',
  '063': '♡8',
  '071': '♤9',
  '072': '♢9',
  '073': '♡9',
  '081': '♤10',
  '082': '♢10',
  '083': '♡10',
  '091': '♤J',
  '092': '♢J',
  '093': '♡J',
  '101': '♤Q',
  '102': '♢Q',
  '103': '♡Q',
  '111': '♤K',
  '112': '♢K',
  '113': '♡K',
  '121': '♤A',
  '122': '♢A',
  '123': '♡A',
  '131': '♤2',
  '132': '♢2',
  '133': '♡2',
  '999': 'Joker',
  '990': 'Joker',
};

const getValueByKey = (key) => {
  return marks[key] || '不明なカード';
};

const Card = ({ mark, isUser, isSelected, onClick, style = {}, onDragStart, onDragOver, onDrop }) => {
  const alt = getValueByKey(mark);
  const src = isUser ? require(`../images/cards/${mark}.png`) : require(`../images/cards/noCard.png`);
  const cardStyle = {
    ...style,
    cursor: isUser ? 'pointer' : 'default',
    display: 'inline-block',
    transform: isSelected ? 'translateY(-20px)' : 'translateY(0)',
    transition: 'transform 0.2s ease', // スムーズなアニメーションのためのトランジション
  };
  const imgStyle = {
    width: '200%',
    height: 'auto',
  };
  return (
    <div onClick={isUser ? onClick : null} style={cardStyle}
      draggable={isUser}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <img src={src} alt={alt} style={imgStyle} />
    </div>
  );
}

export default Card;
