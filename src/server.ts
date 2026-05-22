import app from "./app";
import { db_init } from "./db";


const main = async () => {

  const application = app
  const port = 5000

  await db_init()

  application.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

}

main()
