let currentState = 'REST';

const stateActions = {
  REST: {
    'Handset picked up': () => { playDialTone(); return 'DIAL_TONE'; }
  },
  DIAL_TONE: {
    'Handset replaced': () => { stopDialTone(); ding(); return 'REST'; },
    'Number dialed': () => { return 'DIALING'; }
  },
  DIALING: {
    'Handset replaced': () => { return 'REST'; },
    'Number dialed (complete)': (number) => { executeCommand(number); return 'COMMAND_EXECUTION'; }
  },
  COMMAND_EXECUTION: {
    'Handset replaced': () => { stopCurrentCommand(); return 'REST'; },
    'Timeout (30 sec)': () => { stopCurrentCommand(); return 'REST'; },
    'Command execution complete': () => { return 'REST'; }
  },
  WAITING_FOR_RESPONSE: {
    'Handset picked up': () => { stopRinging(); playResponse(); return 'REST'; },
    'Handset replaced': () => { return 'REST'; },
    'Server response received': () => { ringBell(); return 'WAITING_FOR_PICKUP'; }
  },
  WAITING_FOR_PICKUP: {
    'Handset picked up': () => { stopRinging(); playResponse(); return 'REST'; },
    'Handset replaced': () => { return 'REST'; },
    'Timeout (30 sec)': () => { stopRinging(); return 'REST'; }
  }
};

function handleEvent(event) {
  if (stateActions[currentState] && stateActions[currentState][event]) {
    currentState = stateActions[currentState][event]();
  }
}
