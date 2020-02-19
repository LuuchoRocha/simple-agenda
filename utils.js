import React from "react";
import { Dimensions } from "react-native";

const width = Dimensions.get('window').width;
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const nDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const expandedCalendarHeight = 300;
const collapsedCalendarHeight = 80;
const generateMatrix = (month, year) => {
  let matrix = [];
  let firstDay = new Date(year, month, 1).getDay();
  let maxDays = nDays[month];
  if (month == 1) {
    if ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0) {
      maxDays += 1;
    }
  }
  matrix[0] = weekDays;
  let counter = 1;
  for (let row = 1; row < 7; row++) {
    matrix[row] = [];
    for (let col = 0; col < 7; col++) {
      matrix[row][col] = -1;
      if (row == 1 && col >= firstDay) {
        matrix[row][col] = counter++;
      } else if (row > 1 && counter <= maxDays) {
        matrix[row][col] = counter++;
      }
    }
  }
  return matrix;
};

export { width, months, weekDays, nDays, expandedCalendarHeight, collapsedCalendarHeight, generateMatrix };
