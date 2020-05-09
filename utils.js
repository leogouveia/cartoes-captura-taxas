"use strict";

function pad(value = "", width, n = "0") {
  value = value ? `${value}` : "";
  let zeros = new Array(width - value.length + 1).join(n);
  return value.length >= width ? value : `${zeros}${value}`;
}

function getDataHoraAgora() {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const h = d.getHours();
  const min = pad(d.getMinutes(), 2);
  const ss = pad(d.getSeconds(), 2);
  const ms = d.getMilliseconds();
  return `${y}${m}${day}${h}${min}${ss}${ms}`;
}

module.exports = { getDataHoraAgora };
