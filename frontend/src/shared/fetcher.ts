import axios from "axios";
import { backendUrl } from "./utils";

const fetcher = axios.create({
  baseURL: `${backendUrl}/api`,
  // withCredentials: true,
});

export default fetcher;
