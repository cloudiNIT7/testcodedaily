export type BatchTime = '7:30 am' | '9:00 am' | '10:30 am' | '7:30 pm';

export type TestCodeData = {
  code: string;
  updatedAt: number;
};

export type TestCodesResponse = Record<BatchTime, TestCodeData>;
export type TestCodes = Record<BatchTime, string>;
