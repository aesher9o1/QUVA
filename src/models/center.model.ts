export interface ICenter {
  center_id: number;
  name: string;
  address: string;
  state_name: string;
  district_name: string;
  block_name: string;
  pincode: number;
  lat: number;
  long: number;
  from: string;
  to: string;
  fee_type: string;
  sessions: {
    session_id: string;
    date: string;
    available_capacity: number;
    min_age_limit: number;
    vaccine: string;
    slots: string[];
  }[];
}

export interface ICenterMini {
  name: string;
  address: string;
  pincode: number;
  feeType: string;
  sessions: {
    date: string;
    availableCapacity: number;
    minAgeLimit: number;
    vaccine: string;
    slots: string[];
  }[];
}
