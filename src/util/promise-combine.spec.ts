import './promise-combine';

describe('Promise.combine', () => {
  it('should combine promises', async () => {
    const [one, two] = await Promise.combine([
      Promise.resolve(1),
      Promise.resolve(2),
    ]);

    expect(one).toEqual(1);
    expect(two).toEqual(2);
  });
});
