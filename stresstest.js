import http from 'k6/http';

export let options = {
  stages: [{ duration: '5s', target: 10 }],
};

export default function () {
  http.get(
    'http://localhost:6009/forum/thread/forum_17aa3530-d152-462e-a032-909ae69019ed/page?page=20',
  );
  // http.get("http://localhost:6009/forum/threads?page=0");
}
