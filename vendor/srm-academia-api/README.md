# SRM Academia API

A robust TypeScript/JavaScript client for interacting with the SRMIST KTR Academia portal. This package provides easy-to-use functions to fetch student data including timetables, attendance, marks, user information, and course details.

## Features

- 🔐 **Authentication**: User verification and Password validation
- 📅 **Timetable**: Get timetable data
- 📊 **Attendance**: Get attendance data
- 📈 **Marks**: Get marks data
- 📚 **Course Details**: Get course information data
- 🗓️ **Calendar**: Get academic calendar data
- 👤 **User Info**: Get user information data
- 🛡️ **TypeScript Support**: Full TypeScript definitions included
- ⚡ **Modern ES Modules**: Built with modern JavaScript standards

## Installation

```bash
npm install srm-academia-api@latest
```

## Quick Start

```typescript
import {
  verifyUser,
  verifyPassword,
  getTimetable,
  getAttendance,
  getMarks,
  getUserInfo,
  getCalendar,
  getCourse,
} from "srm-academia-api";
```

## Authentication

```typescript

// VerifyUser

   const { data, error, errorReason} = await verifyUser("USERNAME");

        // error will be true if there is any Internal Server Error
        // errorReason will have reason if there is error
        // data provide the response data

        // Types

              data?:  {
                lookup?: {
                      identifier: string ;
                      digest: string
                         };
                    }
              status_code: number;
              message: string;;
              error?: string;
              errorReason?: unknown;


  // VerifyPassword

   const {data , error , errorReason , isAuthenticated} = await verifyPassword({
     digest: "DIGEST",
    identifier: "IDENTIFIER",
    password: "PASSWORD",
  });

        // error will be true if there is any Internal Server Error
        // errorReason will have reason if there is error
        // data provide the response data
        // isAuthenticated will be true if user has been authenticated

        // Types

                data?: {
                  cookies?: string;
                      statusCode: number;
                      message?: string;
                      captcha?: {
                        required: boolean;
                        digest: string | null | undefined;
                      };
                    };
                isAuthenticated?: boolean;
                error?: string;
                errorReason?: unknown;



 // Logout

    const {message , status } = await logoutUser("COOKIES");

        // Types

                message: string;
                status: number;

```

## Timetable

```typescript

  const { timetable, status, error } = await getTimetable('COOKIES');

          // error will be true if there is any Error with fetch or parsing or even if the cookies wrong
          // timetable provide the response data
          // status will give the response status { 200 : success , 404 : unauthorized , 500 : internal server Error}

          // Types

                timetable?: {
                  dayOrder: string;
                  class: {
                          slot: string;
                          isClass: boolean;
                          courseTitle?: string;
                          courseCode?: string;
                          courseType?: string;
                          courseCategory?: string;
                          courseRoomNo?: string;
                          time: string;
                        }[] ;
                      }[] ;
                error?: string;
                status: number;

```

## Attendance

```typescript

  const { attendance , status, error } = await getAttendance('COOKIES');

          // error will be true if there is any Error with fetch or parsing or even if the cookies wrong
          // attendance provide the response data
          // status will give the response status { 200 : success , 404 : unauthorized , 500 : internal server Error}


          // Types

                attendance?: {
                        courseCode: string;
                        courseTitle: string;
                        courseCategory: string;
                        courseFaculty: string;
                        courseSlot: string;
                        courseConducted: number;
                        courseAbsent: number;
                        courseAttendance: string;
                        }[] ;
                error?: string;
                status: number;

```

## Marks

```typescript

  const { markList , status, error } = await getMarks('COOKIES');

          // error will be true if there is any Error with fetch or parsing or even if the cookies wrong
          // markList provide the response data
          // status will give the response status { 200 : success , 404 : unauthorized , 500 : internal server Error}


          // Types

                markList?: {
                  course: string;
                  category: string;
                  marks: {
                    exam: string;
                    obtained: number;
                    maxMark: number;
                  }[] ;
                  total: { obtained: number; maxMark: number };
                }[] ;
                error?: string;
                status: number;

```

## Course

```typescript

  const { courseList , status, error } = await getCourse('COOKIES');

          // error will be true if there is any Error with fetch or parsing or even if the cookies wrong
          // courseList provide the response data
          // status will give the response status { 200 : success , 404 : unauthorized , 500 : internal server Error}


          // Types

                courseList?: {
                  courseCode: string;
                  courseTitle: string;
                  courseCredit: string;
                  courseCategory: string;
                  courseType: string;
                  courseFaculty: string;
                  courseSlot: string[];
                  courseRoomNo: string;
                }[] ;
                batch?: string;
                error?: string;
                status: number;

```

## Calendar

```typescript

  const { calendar , status, error } = await getCalendar('COOKIES');

          // error will be true if there is any Error with fetch or parsing or even if the cookies wrong
          // calendar provide the response data
          // status will give the response status { 200 : success , 404 : unauthorized , 500 : internal server Error}


          // Types

                  calendar?: {
                      month: string;
                      days: {
                          date: string;
                          day: string;
                          event: string;
                          dayOrder: string;
                      }[] ;
                  }[] ;
                  error?: string;
                  status: number;

```

## User Info

```typescript

  const { userInfo , status, error } = await getUserInfo('COOKIES');

          // error will be true if there is any Error with fetch or parsing or even if the cookies wrong
          // userInfo provide the response data
          // status will give the response status { 200 : success , 404 : unauthorized , 500 : internal server Error}


          // Types
                    userInfo?: {
                        regNumber: string;
                        name: string;
                        mobile: string;
                        section: string;
                        program: string;
                        department: string;
                        semester: string;
                        batch: string;
                    } ;
                    error?: string;
                    status: number;

```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This package is not officially affiliated with SRM Institute of Science and Technology. Use responsibly and in accordance with the institution's terms of service.
