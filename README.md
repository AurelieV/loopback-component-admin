# loopback-component-role-admin
Loopback component for create an admin user, and authorize role adding/deleting easily.

## Usage
In `component-config.json` add
```
"loopback-component-role-admin": {
    "userModel": "MyUser",
    "mongoHack": true
  }
```
With
* userModel the name of your custom user model (by default User)
* mongoHack a value to indicate the use of the mongo hack (useful if you use mongo and want to include roles when fetching user. See [this issue](https://github.com/strongloop/loopback/issues/1441). You must have mongod in your dependencies.


/!\ Use it BEFORE explorer component to see remote method added

## Result

* You have now in MyUser model method addRole, removeRole and findByRole
* A user `admin` (password `admin`) is created if not exist, and role `admin` is create if not exist
* User `admin` has role `admin`
* A user with role `admin` can edit, delete, view user, and add/remove roles
* You can use {"include": "roles"} in your user filter to see roles
