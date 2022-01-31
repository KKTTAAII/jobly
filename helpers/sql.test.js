const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");
const dataToUpdate = { firstName: "Aliya", age: 32 };
const jsToSql = { firstName: "first_name", age: "age" };
const noData = {};

describe("update data", function () {
  test("works: function returns json", function () {
    const updatedData = sqlForPartialUpdate(dataToUpdate, jsToSql);
    expect(updatedData).toEqual({
      setCols: `"first_name"=$1, "age"=$2`,
      values: ["Aliya", 32],
    });
  });

  test("error: did not provide data to update", function () {
    try {
      sqlForPartialUpdate(noData);
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });
});
