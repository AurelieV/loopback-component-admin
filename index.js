var Promise = require('bluebird');
var _ = require('lodash');
var sendError = require('./utils').sendError;

module.exports = function init(app, options) {
  if (!app) return new Promise.reject(new Error('App is not defined'));
  var ACL = options.aclModel ? app.models[options.aclModel] || app.models.ACL : app.models.ACL;
  var Role = options.roleModel ? app.models[options.roleModel] || app.models.Role : app.models.Role;
  var RoleMapping = options.roleMappingModel ? app.models[options.roleMappingModel] || app.models.RoleMapping : app.models.RoleMapping;
  var User = options.userModel ? app.models[options.userModel] || app.models.User : app.models.User;
  var adminEmail = options.adminEmail || 'test@test.fr';

  // Add method addRole to User
  User.addRole = function(id, role, next) {
    next = next || function() {};
    return Role.findOne({where: {name: role}})
      .then(function(role) {
        if (!role) return sendError(next, 'No role found', 404);
        return RoleMapping.findOrCreate({principalType: RoleMapping.USER, principalId: id, roleId: role.id});
      })
      .then(function (data) {
        next(null);
        return null;
      })
      .catch(function (error) {
        return sendError(next, 'Internal error', 500);
      })
  };

  // Add method removeRole to User
  User.removeRole = function(id, role, next) {
    next = next || function() {};
    return Role.findOne({where: {name: role}})
      .then(function(role) {
        if (!role) return sendError(next, 'No role found', 404);
        return RoleMapping.findOne({where:{principalType: RoleMapping.USER, principalId: id, roleId: role.id}});
      })
      .then(function (roleMapping) {
        if (!roleMapping) return;
        return roleMapping.destroy();
      })
      .then(function () {
        next(null);
        return null;
      })
      .catch(function (error) {
        return sendError(next, 'Internal error', 500);
      })
  };

  // Add method findByRole to User
  User.findByRole = function(role, next) {
    next = next || function() {};
    return Role.findOne({where: {name: role}})
      .then(function(role) {
        if (!role) return sendError(next, 'No role found', 404);
        return RoleMapping.find({where: {roleId: role.id, principalType: 'USER'}});
      })
      .then(function (roleMappings) {
        var ids = _.uniq(_.map(roleMappings, 'principalId'));
        return User.find({where: {id: {inq: ids}}});
      })
      .then(function (users) {
        next(null, users);
        return users;
      })
      .catch(function (error) {
        return sendError(next, 'Internal error', 500);
      })
  };

  // Add method getAllRoles to User
  User.getAllRoles = function(req, next) {
    var userId = req.accessToken.userId;
    if (!userId) {
      return sendError(next, 'You are not connected', 401);
    }
    Role.getRoles({principalType: RoleMapping.USER, principalId: userId}, function(err, ids) {
      if (err) {
        return next(err);
      }
      var dataIds = _.filter(ids, (id) => {return !_.isString(id) || id.substr(0, 1) !== '$'});
      var dynamicRoles = _.filter(ids, (id) => {return _.isString(id) && id.substr(0, 1) === '$'});
      // Treat this separately because if dataIds = [], all roles will be return by find request
      if (dataIds.length === 0) {
        next(null, dynamicRoles);
        return Promise.resolve(dynamicRoles);
      }
      Role.find({where: {id: {inq: dataIds}}})
        .then(function (roles) {
          var result = _.map(roles, 'name');
          result = _.uniq(result.concat(dynamicRoles));
          next(null, result);
          return result;
        })
        .catch(function(error) {
          return sendError(next, 'Internal error', 500);
        })
    });
  };

  // Add method getPersistedRoles to User
  User.getPersistedRoles = function(id, next) {
    next = next || function() {};
    return RoleMapping.find({where: {principalType: 'USER', principalId: id}})
      .then(function (roleMappings) {
        var ids = _.uniq(_.map(roleMappings, 'roleId'));
        if (ids.length > 0) {
          return Role.find({where: {id: {inq: ids}}});
        } else {
          return [];
        }
      })
      .then(function (roles) {
        var result = _.map(roles, 'name');
        next(null, result);
        return result;
      })
      .catch(function (error) {
        return sendError(next, 'Internal error', 500);
      })
  };

  // Register remote method
  User.remoteMethod('addRole', {
    accepts: [
      {
        arg: 'id',
        type: 'string',
        required: true
      },
      {
        arg: 'role',
        type: 'string',
        required: true
      }
    ],
    returns: {}
    ,
    http: {
      verb: 'post',
      path: '/:id/addRole'
    }
  });
  User.remoteMethod('removeRole', {
    accepts: [
      {
        arg: 'id',
        type: 'string',
        required: true
      },
      {
        arg: 'role',
        type: 'string',
        required: true
      }
    ],
    returns: {}
    ,
    http: {
      verb: 'post',
      path: '/:id/removeRole'
    }
  });
  User.remoteMethod('findByRole', {
    accepts: {
      arg: 'role',
      type: 'string',
      required: true
    },
    returns: {
      arg: 'users',
      type: '[object]'
    },
    http: {
      verb: 'get'
    }
  });
  User.remoteMethod('getAllRoles', {
    accepts: [
      {
        arg: 'context',
        type: 'object',
        http: {source: 'req'},
        required: true
      }
    ],
    returns: {
      arg: 'roles',
      type: '[string]'
    }
    ,
    http: {
      verb: 'get',
      path: '/roles'
    }
  });
  User.remoteMethod('getPersistedRoles', {
    accepts: [
      {
        arg: 'id',
        type: 'string',
        required: true
      }
    ],
    returns: {
      arg: 'roles',
      type: '[string]'
    }
    ,
    http: {
      verb: 'get',
      path: '/:id/persistedRoles'
    }
  });

  // Add ACL for role managing by admin
  var pUserACL = Promise.all([
    ACL.findOrCreate({
      model: User.modelName,
      accessType: ACL.EXECUTE,
      principalType: ACL.ROLE,
      principalId: 'admin',
      permission: ACL.ALLOW,
      property: 'updateAttributes'
    })
    , ACL.findOrCreate({
      model: User.modelName,
      accessType: ACL.ALL,
      principalType: ACL.ROLE,
      principalId: 'admin',
      permission: ACL.ALLOW,
      property: 'deleteById'
    })
    , ACL.findOrCreate({
      model: User.modelName,
      accessType: 'READ',
      principalType: ACL.ROLE,
      principalId: 'admin',
      permission: ACL.ALLOW,
      property: 'find'
    })
    , ACL.findOrCreate({
      model: User.modelName,
      accessType: 'READ',
      principalType: ACL.ROLE,
      principalId: 'admin',
      permission: ACL.ALLOW,
      property: 'findById'
    })
  ]);

  // Trick to not lauch too much async call
  pUserACL.then(function() {
    return Promise.all([
      ACL.findOrCreate({
        model: User.modelName,
        accessType: ACL.EXECUTE,
        principalType: ACL.ROLE,
        principalId: 'admin',
        permission: ACL.ALLOW,
        property: 'addRole'
      })
      , ACL.findOrCreate({
        model: User.modelName,
        accessType: ACL.READ,
        principalType: ACL.ROLE,
        principalId: '$authenticated',
        permission: ACL.ALLOW,
        property: 'getAllRoles'
      })
      , ACL.findOrCreate({
        model: User.modelName,
        accessType: ACL.EXECUTE,
        principalType: ACL.ROLE,
        principalId: 'admin',
        permission: ACL.ALLOW,
        property: 'removeRole'
      })
      , ACL.findOrCreate({
        model: User.modelName,
        accessType: ACL.READ,
        principalType: ACL.ROLE,
        principalId: 'admin',
        permission: ACL.ALLOW,
        property: 'getPersistedRoles'
      })
      , ACL.findOrCreate({
        model: User.modelName,
        accessType: ACL.READ,
        principalType: ACL.ROLE,
        principalId: 'admin',
        permission: ACL.ALLOW,
        property: 'findByRole'
      })
    ]);
  });

  // Create admin role
  var pAdminRole = Role.findOrCreate({name: 'admin'}).then(function (data) {return data[0]});
  // Create admin user
  var pAdminUser = User.findOrCreate({where: {username: 'admin'}},
    {
      username: 'admin',
      email: adminEmail,
      password: 'admin',
      emailVerified: true
    }).then(function (data) {return data[0]});

  // Add role admin to user admin
  var pNominateAdmin = Promise.join(pAdminRole, pAdminUser, function (adminRole, adminUser) {
    return RoleMapping.findOrCreate({principalType: RoleMapping.USER, principalId: adminUser.id, roleId: adminRole.id});
  });

  return Promise.all([pNominateAdmin, pUserACL]);
};
