import React from 'react';

// カードデッキの初期化
export const initializeDeck = () => {
  const suits = ['1', '2', '3']; // 1:スペード、2:ダイヤ、3:ハート
  const values = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13'];
  let deck = [];

  for (let suit of suits) {
    for (let value of values) {
      deck.push({ suit, value });
    }
  }

  // ジョーカーを追加
  deck.push({ suit: '9', value: '99' });

  return deck;
};

// ヒンドゥーシャッフル
const hinduShuffle = (deck) => {
  const middleIndex = Math.floor(deck.length / 2);
  const cutSize = Math.floor(Math.random() * 8) + 3; // 3～10枚分のカードを抜き取る
  const cutStart = Math.max(0, middleIndex - Math.floor(cutSize / 2));
  const cutDeck = deck.splice(cutStart, cutSize);
  deck = cutDeck.concat(deck);
  return deck;
};

// リフルシャッフル
const riffleShuffle = (deck) => {
  const half = Math.floor(deck.length / 2);
  let left = deck.slice(0, half);
  let right = deck.slice(half);
  let isLeft = false;

  let shuffledDeck = [];
  while (left.length && right.length) {
    if (Math.random() > 0.4 && !isLeft) {
      shuffledDeck.push(left.shift());
      isLeft = true;
    } else {
      shuffledDeck.push(right.shift());
      isLeft = false;
    }
  }
  return shuffledDeck.concat(left).concat(right);
};

// シャッフルロジック
export const shuffleDeck = (deck) => {
  // ヒンドゥーシャッフルを6～10回
  const hinduShuffles = Math.floor(Math.random() * 6) + 5;
  for (let i = 0; i < hinduShuffles; i++) {
    deck = hinduShuffle(deck);
  }

  // リフルシャッフルを1～3回
  const riffleShuffles = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < riffleShuffles; i++) {
    deck = riffleShuffle(deck);
  }

  // 最後にヒンドゥーシャッフルを3～4回
  const finalHinduShuffles = Math.floor(Math.random() * 3) + 2;
  for (let i = 0; i < finalHinduShuffles; i++) {
    deck = hinduShuffle(deck);
  }

  return deck;
};