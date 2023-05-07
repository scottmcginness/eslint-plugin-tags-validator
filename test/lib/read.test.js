const chai = require('chai');
const dedent = require('dedent');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const sentinel = require('unit-test-sentinel');

const { expect } = chai;

chai.use(sinonChai);

const fsReadStub = sinon.stub();

const { readAllowedValues } = proxyquire('../../lib/read', {
  fs: {
    readFileSync: fsReadStub
  },
  './memoize': (/** @type {any} */ func) => func
});

describe('read', () => {
  describe('readAllowedValues', () => {
    /** @type {any} */
    let contextUt;

    /** @type {Sentinel.Objects} */
    let ф;

    beforeEach(() => {
      contextUt = {};
      ф = sentinel.create();

      fsReadStub.reset();
    });

    context('when using the default list', () => {
      beforeEach(() => {
        contextUt.options = [];
      });

      it('returns the default list', () => {
        const [values, using] = readAllowedValues(contextUt);
        expect(using).to.equal('default list');
        expect(values).to.deep.equal([
          '@smoke',
          '@regression',
          '@slow',
          '@fast',
          '@low',
          '@medium',
          '@high',
          '@critical'
        ]);
      });
    });

    context('when an option is given, but it’s empty', () => {
      beforeEach(() => {
        contextUt.options = [{}];
      });

      it('throws an exception', () => {
        expect(() => readAllowedValues(contextUt)).to.throw(
          "Option must be either 'allowedValues' or 'markdownFile'."
        );
      });
    });

    context('when given allowedValues', () => {
      beforeEach(() => {
        contextUt.options = [{ allowedValues: ф.allowedList }];
      });

      it('returns those allowed values', () => {
        const [values, using] = readAllowedValues(contextUt);
        expect(using).to.equal('allowed values');
        expect(values).to.equal(ф.allowedList);
      });
    });

    context('when given markdownFile', () => {
      beforeEach(() => {
        contextUt.options = [{ markdownFile: ф.markdownFilePath }];
      });

      // eslint-disable-next-line mocha/no-setup-in-describe
      [{
        name: 'single tag',
        file: dedent`
          @first`,
        expected: ['@first']
      }, {
        name: 'two tags',
        file: dedent`
          @first
          @second`,
        expected: ['@first', '@second']
      }, {
        name: 'multiple tags with comments and surrounding text',
        file: dedent`
          This is a title
          - @first
          - @second  -> some comment
            • @third  // some other comment, which will be ignored
            • @fourth
          + @fifth (more commentary)
          
          
          Thiis is a footer`,
        expected: ['@first', '@second', '@third', '@fourth', '@fifth']
      }]
        .forEach(({ name, file, expected }) => {
          it(`returns a variety of tags from the given file (${name})`, () => {
            fsReadStub.returns(file);

            const [values, using] = readAllowedValues(contextUt);
            expect(using).to.equal('markdown file');
            expect(values).to.deep.equal(expected);

            expect(fsReadStub).to.have.been.calledWith(ф.markdownFilePath, 'utf8');
          });
        });
    });
  });
});
