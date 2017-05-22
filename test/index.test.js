const test = require('ava');
const moment = require('moment-timezone');
const {
  Dialga,
  toDate,
  getAvgInterval,
} = require('../src/index');
const values = require('../src/constants/values');

/* eslint-disable new-cap */

// constructor
test('constructor - fails when invalid moment date format', (t) => {
  t.throws(
    () => new Dialga('2000-02-31', { months: 1 }, 'UTC'), // 31st February is not valid date
    Error,
    'start date cannot be parsed by moment'
  );
});

test('constructor - fails when timezone invalid', (t) => {
  t.throws(
    () => new Dialga('2000-01-01', { months: 1 }, 'Adventure/Time'),
    Error,
    'timezone is invalid'
  );
});

// .occurance tests

test('.occurance - 0 gives the first occurance (matches rule start)', (t) => {
  const TZ = 'UTC';
  const rule = new Dialga('2000-03-01', { months: 1 }, TZ);

  const result = rule.occurance(0);
  t.deepEqual(result.toDate(), new moment.tz('2000-03-01', TZ).toDate());
});

test('.occurance - 4 gives the fifth occurance', (t) => {
  const TZ = 'UTC';
  const rule = new Dialga('2000-03-01', { months: 1 }, TZ);

  const result = rule.occurance(4);
  t.deepEqual(result.toDate(), new moment.tz('2000-07-01', TZ).toDate());
});

test('.occurance - throws error if i not a number', (t) => {
  const TZ = 'UTC';
  const rule = new Dialga('2000-03-01', { months: 1 }, TZ);

  t.throws(
    () => rule.occurance('1'),
    Error,
    'first argument must be a number',
  );
});

// .first tests

test('.first - gives correct number of occurences', (t) => {
  const TZ = 'UTC';
  const rule = new Dialga('2000-01-01', {}, TZ);

  const times = 8;
  const result = toDate(rule.first(times));
  t.is(result.length, times);
});

test('.first - uses the TZ specified', (t) => {
  const TZ = 'Pacific/Auckland';
  const rule = new Dialga('2000-01-01', {}, TZ);

  const times = 1;
  const result = toDate(rule.first(times));
  const expected = [new moment.tz('2000-01-01', TZ).toDate()];

  t.deepEqual(result, expected);
});

test('.first - monthly', (t) => {
  const TZ = 'UTC';
  const rule = new Dialga('2000-03-01', { months: 1 }, TZ);

  const times = 5;
  const result = toDate(rule.first(times));
  const expected = [
    moment.tz('2000-03-01', TZ).toDate(),
    moment.tz('2000-04-01', TZ).toDate(),
    moment.tz('2000-05-01', TZ).toDate(),
    moment.tz('2000-06-01', TZ).toDate(),
    moment.tz('2000-07-01', TZ).toDate(),
  ];
  t.deepEqual(result, expected);
});

test('.first - weekly', (t) => {
  const TZ = 'UTC';
  const rule = new Dialga('2015-06-15', { weeks: 1 }, TZ);

  const times = 5;
  const result = toDate(rule.first(times));
  const expected = [
    moment.tz('2015-06-15', TZ).toDate(),
    moment.tz('2015-06-22', TZ).toDate(),
    moment.tz('2015-06-29', TZ).toDate(),
    moment.tz('2015-07-06', TZ).toDate(),
    moment.tz('2015-07-13', TZ).toDate(),
  ];
  t.deepEqual(result, expected);
});

test('.first - daily', (t) => {
  const TZ = 'UTC';
  const rule = new Dialga('2018-06-15', { days: 1 }, TZ);

  const times = 5;
  const result = toDate(rule.first(times));
  const expected = [
    moment.tz('2018-06-15', TZ).toDate(),
    moment.tz('2018-06-16', TZ).toDate(),
    moment.tz('2018-06-17', TZ).toDate(),
    moment.tz('2018-06-18', TZ).toDate(),
    moment.tz('2018-06-19', TZ).toDate(),
  ];
  t.deepEqual(result, expected);
});

// .between tests

test('.between - daily', (t) => {
  const TZ = 'UTC';
  const rule = new Dialga('2012-08-22', { days: 1 }, TZ);

  const result = toDate(rule.between('2013-05-03', '2013-05-08'));
  const expected = [
    new moment.tz('2013-05-03', TZ).toDate(),
    new moment.tz('2013-05-04', TZ).toDate(),
    new moment.tz('2013-05-05', TZ).toDate(),
    new moment.tz('2013-05-06', TZ).toDate(),
    new moment.tz('2013-05-07', TZ).toDate(),
  ];

  t.deepEqual(result, expected);
});

test('.between - daily where from and to do not match rule', (t) => {
  const TZ = 'UTC';
  const rule = new Dialga('2012-08-22', { days: 1 }, TZ);

  const result = toDate(
    rule.between('2013-05-02 20:00:00', '2013-05-07 15:00:00')
  );
  const expected = [
    new moment.tz('2013-05-03', TZ).toDate(),
    new moment.tz('2013-05-04', TZ).toDate(),
    new moment.tz('2013-05-05', TZ).toDate(),
    new moment.tz('2013-05-06', TZ).toDate(),
    new moment.tz('2013-05-07', TZ).toDate(),
  ];
  t.deepEqual(result, expected);
});

// this is to ensure results are accurate using getAverageInterval
// month, quarter and year values are all averages so may be affected
// by large differences between rule "start", and between "from"
test('.between - where from date is far in the future', (t) => {
  const TZ = 'UTC';
  const rule = new Dialga('2017-05-03', { days: 7 }, TZ); // Wednesday 3rd May 2017 UTC

  const result = toDate(rule.between('2117-05-05', '2117-06-02'));
  const expected = [
    moment.tz('2117-05-05', TZ).toDate(),
    moment.tz('2117-05-12', TZ).toDate(),
    moment.tz('2117-05-19', TZ).toDate(),
    moment.tz('2117-05-26', TZ).toDate(),
  ];
  t.deepEqual(result, expected);
});

// .getAvgInterval tests

test('.getAvgInterval - calculates correct values using words', (t) => {
  const interval = { months: 2, days: 1 };
  const result = getAvgInterval(interval);
  const expected = (values.Month * 2) + values.Day;

  t.is(result, expected);
});


test('.getAvgInterval - calculates correct values using shorthand', (t) => {
  const interval = { Q: 2, m: 30 };
  const result = getAvgInterval(interval);
  const expected = (values.Quarter * 2) + (values.Minute * 30);

  t.is(result, expected);
});

/* eslint-disable new-cap */
