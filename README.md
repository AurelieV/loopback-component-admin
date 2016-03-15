# loopback-component-roles
Component for [Loopback](http://loopback.io/), adding roles management to your User model.

## Usage
In `component-config.json` add
```
"loopback-component-roles": {
    "userModel": "MyUser"
}
```
When `MyUser` is the name of your custom User model (by default, build-in User model will be used).

## Warnings
* If you want to see the method added in the explorer, take care of load the `loopback-component-explorer` after `loopback-component-roles`
in `component-config.json`
* There is currently [an open issue](https://github.com/strongloop/loopback/issues/1441) in the mongo datasource connector. 
To be able to include roles when fetching user while using a mongo database, please use the following config
```
"loopback-component-roles": {
    "userModel": "MyUser",
    "mongoHack": true
}
```

## What does this component do?
* Create a role `admin` if not exist
* Create an `admin` user (password by default: `admin`) if not exist
* Give role `admin` to `admin` user
* Create ACLs to allow `admin` manipulate roles and users
* Add relation `roles` to User model
* Add remote methods `addRole`, `removeRole`, `findByRole` to User modela
