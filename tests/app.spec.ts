import o from 'ospec';

o.spec('index test', () => {
  o('should always pass', () => {
    o(true).equals(true);
  });
});