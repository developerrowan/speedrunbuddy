export const regexpCommand = new RegExp(
  /^!([a-zA-Z0-9]+)(?:(?:[^\w"“]+)?(?:“|")([^"“”]+)(?:”|")?(?:\W+)?)?(.*)?/
);

export const SOMETHING_WENT_WRONG_MSG =
  'Sorry, something went wrong. :( If this keeps happening, contact my creator!';

export const INTRODUCTORY_MSG = `Hi! I'm speedrunbuddy! I'm here to help you find your favourite streamer's PBs using just simple commands! 
    Learn more about me and what I can do at https://github.com/developerrowan/speedrunbuddy`;

export const AUTH_SCOPE = ['chat:edit', 'chat:read'];
