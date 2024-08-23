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
          "Option must be either 'allowedValues', 'markdownFile' or 'packageJson'."
        );
      });
    });

    context('when given allowedValues', () => {
      beforeEach(() => {
        contextUt.options = [{ allowedValues: ['@fast', '@slow'] }];
      });

      it('returns those allowed values', () => {
        const [values, using] = readAllowedValues(contextUt);
        expect(using).to.equal('allowed values');
        expect(values).to.deep.equal(['@fast', '@slow']);
      });

      it('returns those allowed values with prepended @-sign (by default), no trailing whitespace and no duplicates', () => {
        contextUt.options[0].allowedValues.push('fast   ', 'dup', '@dup');
        const [values, using] = readAllowedValues(contextUt);
        expect(using).to.equal('allowed values');
        expect(values).to.deep.equal(['@fast', '@slow', '@dup']);
      });

      it('returns those allowed values with prepended @-sign (when configured true), no trailing whitespace and no duplicates', () => {
        contextUt.options[0].prependAtSign = true;
        contextUt.options[0].allowedValues.push('fast   ', 'dup', '@dup');
        const [values, using] = readAllowedValues(contextUt);
        expect(using).to.equal('allowed values');
        expect(values).to.deep.equal(['@fast', '@slow', '@dup']);
      });

      it('returns those allowed values with prepended @-sign (when configured false), no trailing whitespace and no duplicates', () => {
        contextUt.options[0].prependAtSign = false;
        contextUt.options[0].allowedValues.push('fast   ', 'dup', '@dup');
        const [values, using] = readAllowedValues(contextUt);
        expect(using).to.equal('allowed values');
        expect(values).to.deep.equal(['@fast', '@slow', 'fast', 'dup', '@dup']);
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
          + @fifth (this is a duplicate)
          - @fifth2 2 is a number on the end
          
          
          Thiis is a footer`,
        expected: ['@first', '@second', '@third', '@fourth', '@fifth', '@fifth2']
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

    context('when given packageJson', () => {
      beforeEach(() => {
        contextUt.options = [{ packageJson: 'packageTags' }];
      });

      context('when the package.json cannot be read', () => {
        beforeEach(() => {
          fsReadStub.throws('Unable to read package');
        });

        it('throws an error', () => {
          expect(() => readAllowedValues(contextUt)).to.throw(
            'Could not read package.json file for tag values.'
          );
        });
      });

      context('when the package.json cannot be read as JSON', () => {
        beforeEach(() => {
          fsReadStub.returns('Bad package');
        });

        it('throws an error', () => {
          expect(() => readAllowedValues(contextUt)).to.throw(
            'Could not read package.json file for tag values.'
          );
        });
      });

      context('when the package.json does not have the given property', () => {
        beforeEach(() => {
          fsReadStub.returns(JSON.stringify({}));
        });

        it('throws an error', () => {
          expect(() => readAllowedValues(contextUt)).to.throw(
            "Did not find property 'packageTags' in package.json file."
          );
        });
      });

      context('when the package.json has the given property', () => {
        it('throws an error if they are a number', () => {
          fsReadStub.returns(JSON.stringify({ packageTags: 123 }));

          expect(() => readAllowedValues(contextUt)).to.throw(
            "Property 'packageTags' in package.json file was neither an array nor an object of arrays."
          );
        });

        it('throws an error if they are a string', () => {
          fsReadStub.returns(JSON.stringify({ packageTags: 'abc' }));

          expect(() => readAllowedValues(contextUt)).to.throw(
            "Property 'packageTags' in package.json file was neither an array nor an object of arrays."
          );
        });

        it('throws an error if they are a boolean', () => {
          fsReadStub.returns(JSON.stringify({ packageTags: true }));

          expect(() => readAllowedValues(contextUt)).to.throw(
            "Property 'packageTags' in package.json file was neither an array nor an object of arrays."
          );
        });

        it('returns the list if they are an array of names', () => {
          fsReadStub.returns(JSON.stringify({ packageTags: ['@Fast'] }));

          const [values] = readAllowedValues(contextUt);
          expect(values).to.deep.equal(['@Fast']);
        });

        it('returns the list if they are an array of names with duplicates', () => {
          fsReadStub.returns(JSON.stringify({ packageTags: ['@Fast', '@Fast'] }));

          const [values] = readAllowedValues(contextUt);
          expect(values).to.deep.equal(['@Fast']);
        });

        it('returns the list with @-sign prepended if they are an array of names, some of which do not have the @-sign (by default)', () => {
          fsReadStub.returns(JSON.stringify({ packageTags: ['@Fast', 'Slow'] }));

          const [values] = readAllowedValues(contextUt);
          expect(values).to.deep.equal(['@Fast', '@Slow']);
        });

        it('returns the list with @-sign prepended (when configured true) if they are an array of names, some of which do not have the @-sign', () => {
          contextUt.options[0].prependAtSign = true;

          fsReadStub.returns(JSON.stringify({ packageTags: ['@Fast', 'Slow'] }));

          const [values] = readAllowedValues(contextUt);
          expect(values).to.deep.equal(['@Fast', '@Slow']);
        });

        it('returns the list, as given, without @-sign prepended (when configured false) if they are an array of names', () => {
          contextUt.options[0].prependAtSign = false;

          fsReadStub.returns(JSON.stringify({ packageTags: ['@Fast', 'Slow'] }));

          const [values] = readAllowedValues(contextUt);
          expect(values).to.deep.equal(['@Fast', 'Slow']);
        });

        it('returns the leaves of the object tree if they are an object', () => {
          const packageTags = {
            Blue: ['@Fast', '@Slow'],
            Red: ['@Easy', '@Hard'],
            Green: ['@Good', '@Bad'],
            Orange: ['@Manual', '@Perf'],
            Ignored: {}
          };

          fsReadStub.returns(JSON.stringify({ packageTags }));

          const [values] = readAllowedValues(contextUt);
          expect(values).to.deep.equal(['@Fast', '@Slow', '@Easy', '@Hard', '@Good', '@Bad', '@Manual', '@Perf']);
        });

        it('returns the leaves of the object tree if they are an object, allowing for duplicates', () => {
          const packageTags = {
            Blue: ['@Fast', '@Slow'],
            Red: ['@Easy', '@Hard'],
            Green: ['@Good', '@Bad'],
            Orange: ['@Manual', '@Perf', '@Fast', '@Easy'],
            Ignored: {}
          };

          fsReadStub.returns(JSON.stringify({ packageTags }));

          const [values] = readAllowedValues(contextUt);
          expect(values).to.deep.equal(['@Fast', '@Slow', '@Easy', '@Hard', '@Good', '@Bad', '@Manual', '@Perf']);
        });

        it('returns the leaves of the object tree, with @-sign prepended, if they are an object, allowing for some that do not have the @-sign (by default)', () => {
          const packageTags = {
            Blue: ['@Fast', '@Slow'],
            Red: ['@Easy', 'Hard'],
            Green: ['@Good', 'Bad'],
            Orange: ['@Manual', '@Perf', 'Fast', '@Easy'],
            Ignored: {}
          };

          fsReadStub.returns(JSON.stringify({ packageTags }));

          const [values] = readAllowedValues(contextUt);
          expect(values).to.deep.equal(['@Fast', '@Slow', '@Easy', '@Hard', '@Good', '@Bad', '@Manual', '@Perf']);
        });

        it('returns the leaves of the object tree, with @-sign prepended (when configured true), if they are an object, allowing for some that do not have the @-sign', () => {
          contextUt.options[0].prependAtSign = true;

          const packageTags = {
            Blue: ['@Fast', '@Slow'],
            Red: ['@Easy', 'Hard'],
            Green: ['@Good', 'Bad'],
            Orange: ['@Manual', '@Perf', 'Fast', '@Easy'],
            Ignored: {}
          };

          fsReadStub.returns(JSON.stringify({ packageTags }));

          const [values] = readAllowedValues(contextUt);
          expect(values).to.deep.equal(['@Fast', '@Slow', '@Easy', '@Hard', '@Good', '@Bad', '@Manual', '@Perf']);
        });

        it('returns the leaves of the object tree, as given without @-sign prepended (when configured false), if they are an object', () => {
          contextUt.options[0].prependAtSign = false;

          const packageTags = {
            Blue: ['Fast', 'Slow'],
            Red: ['@Easy', 'Hard'],
            Green: ['@Good', 'Bad'],
            Orange: ['@Manual', '@Perf', 'Fast', '@Easy'],
            Ignored: {}
          };

          fsReadStub.returns(JSON.stringify({ packageTags }));

          const [values] = readAllowedValues(contextUt);
          expect(values).to.deep.equal(['Fast', 'Slow', '@Easy', 'Hard', '@Good', 'Bad', '@Manual', '@Perf']);
        });

        it('returns a using value containing the given package property', () => {
          fsReadStub.returns(JSON.stringify({ packageTags: ['@Fast'] }));

          const [, using] = readAllowedValues(contextUt);
          expect(using).to.equal("package 'packageTags'");
        });
      });
    });

    context('when given pattern', () => {
      beforeEach(() => {
        contextUt.options = [{ pattern: 'fa(st|ntastic|bulous|iling)' }];
      });

      it("returns the RegExp'd pattern with a 'pattern' using message", () => {
        const [values, using] = readAllowedValues(contextUt);
        expect(using).to.equal("pattern 'fa(st|ntastic|bulous|iling)'");
        expect(values).to.deep.equal(/fa(st|ntastic|bulous|iling)/);
      });
    });
  });
});
