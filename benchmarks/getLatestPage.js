import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 30,
  duration: '5s',
};
export default function () {
  http.get(
    `http://localhost:6009/forum/thread/forum_17aa3530-d152-462e-a032-909ae69019ed/latestPage?perPage=100`,
  );
  sleep(1);
}
