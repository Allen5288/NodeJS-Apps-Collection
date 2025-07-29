# `2. Error Handling Practices`

## ![✔] 2.1 Use Async-Await or promises for async error handling

**TL;DR:** Handling async errors in callback style is probably the fastest way to hell (a.k.a the pyramid of doom). The best gift you can give to your code is using Promises with async-await which enables a much more compact and familiar code syntax like try-catch

**Otherwise:** Node.js callback style, function(err, response), is a promising way to un-maintainable code due to the mix of error handling with casual code, excessive nesting, and awkward coding patterns

🔗 [**Read More: avoiding callbacks**](./sections/asyncerrorhandling.md)

<br/><br/>

## ![✔] 2.2 Extend the built-in Error object

### `📝 #updated`

**TL;DR:** Some libraries throw errors as a string or as some custom type – this complicates the error handling logic and the interoperability between modules. Instead, create app error object/class that extends the built-in Error object and use it whenever rejecting, throwing or emitting an error. The app error should add useful imperative properties like the error name/code and isCatastrophic. By doing so, all errors have a unified structure and support better error handling. There is `no-throw-literal` ESLint rule that strictly checks that (although it has some [limitations](https://eslint.org/docs/rules/no-throw-literal) which can be solved when using TypeScript and setting the `@typescript-eslint/no-throw-literal` rule)

**Otherwise:** When invoking some component, being uncertain which type of errors come in return – it makes proper error handling much harder. Even worse, using custom types to describe errors might lead to loss of critical error information like the stack trace!

🔗 [**Read More: using the built-in error object**](./sections/useonlythebuiltinerror.md)

<br/><br/>

## ![✔] 2.3 Distinguish catastrophic errors from operational errors

### `📝 #updated`

**TL;DR:** Operational errors (e.g. API received an invalid input) refer to known cases where the error impact is fully understood and can be handled thoughtfully. On the other hand, catastrophic error (also known as programmer errors) refers to unusual code failures that dictate to gracefully restart the application

**Otherwise:** You may always restart the application when an error appears, but why let ~5000 online users down because of a minor, predicted, operational error? The opposite is also not ideal – keeping the application up when an unknown catastrophic issue (programmer error) occurred might lead to an unpredicted behavior. Differentiating the two allows acting tactfully and applying a balanced approach based on the given context

🔗 [**Read More: operational vs programmer error**](./sections/operationalvsprogrammererror.md)

<br/><br/>

## ![✔] 2.4 Handle errors centrally, not within a middleware

**TL;DR:** Error handling logic such as logging, deciding whether to crash and monitoring metrics should be encapsulated in a dedicated and centralized object that all entry-points (e.g. APIs, cron jobs, scheduled jobs) call when an error comes in

**Otherwise:** Not handling errors within a single place will lead to code duplication and probably to improperly handled errors

🔗 [**Read More: handling errors in a centralized place**](./sections/centralizedhandling.md)

<br/><br/>

## ![✔] 2.5 Document API errors using OpenAPI or GraphQL

**TL;DR:** Let your API callers know which errors might come in return so they can handle these thoughtfully without crashing. For RESTful APIs, this is usually done with documentation frameworks like OpenAPI. If you're using GraphQL, you can utilize your schema and comments as well

**Otherwise:** An API client might decide to crash and restart only because it received back an error it couldn’t understand. Note: the caller of your API might be you (very typical in a microservice environment)

🔗 [**Read More: documenting API errors in Swagger or GraphQL**](./sections/documentingusingswagger.md)

<br/><br/>

## ![✔] 2.6 Exit the process gracefully when a stranger comes to town

**TL;DR:** When an unknown error occurs (catastrophic error, see best practice 2.3) - there is uncertainty about the application healthiness. In this case, there is no escape from making the error observable, shutting off connections and exiting the process. Any reputable runtime framework like Dockerized services or cloud serverless solutions will take care to restart

**Otherwise:** When an unfamiliar exception occurs, some object might be in a faulty state (e.g. an event emitter which is used globally and not firing events anymore due to some internal failure) and all future requests might fail or behave crazily

🔗 [**Read More: shutting the process**](./sections/shuttingtheprocess.md)

<br/><br/>

## ![✔] 2.7 Use a mature logger to increase errors visibility

### `📝 #updated`

**TL;DR:** A robust logging tools like [Pino](https://github.com/pinojs/pino) or [Winston](https://github.com/winstonjs/winston) increases the errors visibility using features like log-levels, pretty print coloring and more. Console.log lacks these imperative features and should be avoided. The best in class logger allows attaching custom useful properties to log entries with minimized serialization performance penalty. Developers should write logs to `stdout` and let the infrastructure pipe the stream to the appropriate log aggregator

**Otherwise:** Skimming through console.logs or manually through messy text file without querying tools or a decent log viewer might keep you busy at work until late

🔗 [**Read More: using a mature logger**](./sections/usematurelogger.md)

<br/><br/>

## ![✔] 2.8 Test error flows using your favorite test framework

### `📝 #updated`

**TL;DR:** Whether professional automated QA or plain manual developer testing – Ensure that your code not only satisfies positive scenarios but also handles and returns the right errors. On top of this, simulate deeper error flows like uncaught exceptions and ensure that the error handler treat these properly (see code examples within the "read more" section)

**Otherwise:** Without testing, whether automatically or manually, you can’t rely on your code to return the right errors. Without meaningful errors – there’s no error handling

🔗 [**Read More: testing error flows**](./sections/testingerrorflows.md)

<br/><br/>

## ![✔] 2.9 Discover errors and downtime using APM products

**TL;DR:** Monitoring and performance products (a.k.a APM) proactively gauge your codebase or API so they can automagically highlight errors, crashes, and slow parts that you were missing

**Otherwise:** You might spend great effort on measuring API performance and downtimes, probably you’ll never be aware which are your slowest code parts under real-world scenario and how these affect the UX

🔗 [**Read More: using APM products**](./sections/apmproducts.md)

<br/><br/>

## ![✔] 2.10 Catch unhandled promise rejections

### `📝 #updated`

**TL;DR:** Any exception thrown within a promise will get swallowed and discarded unless a developer didn’t forget to explicitly handle it. Even if your code is subscribed to `process.uncaughtException`! Overcome this by registering to the event `process.unhandledRejection`

**Otherwise:** Your errors will get swallowed and leave no trace. Nothing to worry about

🔗 [**Read More: catching unhandled promise rejection**](./sections/catchunhandledpromiserejection.md)

<br/><br/>

## ![✔] 2.11 Fail fast, validate arguments using a dedicated library

**TL;DR:** Assert API input to avoid nasty bugs that are much harder to track later. The validation code is usually tedious unless you are using a modern validation library like [ajv](https://www.npmjs.com/package/ajv), [zod](https://github.com/colinhacks/zod), or [typebox](https://github.com/sinclairzx81/typebox)

**Otherwise:** Consider this – your function expects a numeric argument “Discount” which the caller forgets to pass, later on, your code checks if Discount!=0 (amount of allowed discount is greater than zero), then it will allow the user to enjoy a discount. OMG, what a nasty bug. Can you see it?

🔗 [**Read More: failing fast**](./sections/failfast.md)

<br/><br/>

## ![✔] 2.12 Always await promises before returning to avoid a partial stacktrace

### `🌟 #new`

**TL;DR:** Always do `return await` when returning a promise to benefit full error stacktrace. If a
function returns a promise, that function must be declared as `async` function and explicitly
`await` the promise before returning it

**Otherwise:** The function that returns a promise without awaiting won't appear in the stacktrace.
Such missing frames would probably complicate the understanding of the flow that leads to the error,
especially if the cause of the abnormal behavior is inside of the missing function

🔗 [**Read More: returning promises**](./sections/returningpromises.md)

<br/><br/>

## ![✔] 2.13 Subscribe to event emitters and streams 'error' event

### `🌟 #new`

**TL;DR:** Unlike typical functions, a try-catch clause won't get errors that originate from Event Emitters and anything inherited from it (e.g., streams). Instead of try-catch, subscribe to an event emitter's 'error' event so your code can handle the error in context. When dealing with [EventTargets](https://nodejs.org/api/events.html#eventtarget-and-event-api) (the web standard version of Event Emitters) there are no 'error' event and all errors end in the process.on('error) global event - in this case, at least ensure that the process crash or not based on the desired context. Also, mind that error originating from _asynchronous_ event handlers are not get caught unless the event emitter is initialized with {captureRejections: true}

**Otherwise:** Event emitters are commonly used for global and key application functionality such as DB or message queue connection. When this kind of crucial objects throw an error, at best the process will crash due to unhandled exception. Even worst, it will stay alive as a zombie while a key functionality is turned off

<br/><br/><br/>

<p align="right"><a href="#table-of-contents">⬆ Return to top</a></p>
