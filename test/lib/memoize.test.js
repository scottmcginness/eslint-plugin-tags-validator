const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const sentinel = require('unit-test-sentinel');
const memoize = require('../../lib/memoize');

const { expect } = chai;
chai.use(sinonChai);

describe('memoize', () => {
  /** @type {Sentinel.Objects} */
  let ф;

  /** @type {((sequence?: any[]) => (arg: any) => any)} */
  let makeSut;

  beforeEach(() => {
    ф = sentinel.create();

    makeSut = (sequence) => {
      let counter = -1;
      const values = sequence ?? [ф.value1, ф.value2, ф.value3];
      const funcUnderTest = () => {
        counter += 1;
        return values[counter];
      };

      return memoize(funcUnderTest);
    };
  });

  it('returns the value from the function when called for the first time with any argument', () => {
    const sut = makeSut();
    expect(sut()).to.equal(ф.value1);
  });

  it('returns the exact same value from the function when called for the second time with any argument', () => {
    const sut = makeSut();

    sut();
    expect(sut()).to.equal(ф.value1);
  });

  it('does not return null forever if the function returns null the first time', () => {
    const sut = makeSut([null, 'second', 'third']);

    sut();
    expect(sut()).to.equal('second');
  });

  it('does not return undefined forever if the function returns undefined the first time', () => {
    const sut = makeSut([undefined, 'second', 'third']);

    sut();
    expect(sut()).to.equal('second');
  });

  it('calls the function with the argument given', () => {
    const funcUnderTest = sinon.stub();
    const sut = memoize(funcUnderTest);
    sut(ф.inputArg);

    expect(funcUnderTest).to.have.been.calledWith(ф.inputArg);
  });

  it('ignores any other arguments', () => {
    const funcUnderTest = sinon.stub();
    const sut = memoize(funcUnderTest);

    // @ts-ignore
    sut(ф.inputArg, ф.otherArg);

    expect(funcUnderTest).to.have.been.calledWith(ф.inputArg);
  });
});
